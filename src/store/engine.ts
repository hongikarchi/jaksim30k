/**
 * 가짜 서버의 규칙 엔진 (SPEC 2장, 7.2). 상태를 받아 시간이 흐른 만큼 처리한다.
 * 진짜 백엔드가 생기면 이 파일의 일이 서버의 스케줄러·배치로 옮겨간다.
 */
import {
  DAY,
  HOUR,
  KIND_MISSION,
  dateKey,
  stageAmount,
  weekdayIndex,
  windowTimes,
} from '../domain/rules';
import type {
  AppEvent,
  AppEventType,
  Charge,
  Occurrence,
  PromiseT,
  Submission,
} from '../domain/types';
import type { Data } from './data';

export const REVIEW_HOURS = 6;
export const DISPUTE_REVIEW_HOURS = 12;
export const DENIED_CHARGE_DELAY_HOURS = 12;
export const CHARGE_DELAY_HOURS = 24;
export const PAYMENT_GRACE_HOURS = 72;
export const RUN_MIN_KM = 5;

let seq = 0;
export const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(seq++).toString(36)}`;

export const occId = (promiseId: string, date: string) => `${promiseId}:${date}`;

export function pushEvent(d: Data, type: AppEventType, at: number, extra: Partial<AppEvent> = {}) {
  d.events.push({ id: newId('ev'), type, at, seen: false, ...extra });
  // 오래된 사건은 버린다
  if (d.events.length > 100) d.events.splice(0, d.events.length - 100);
}

/** 약속의 앞뒤 인증 창을 만든다. SPEC 7.2는 다음 7일치지만, 쉬어가기 예약을 위해 다음 달 말까지 만든다 */
export function generateOccurrences(d: Data, p: PromiseT, now: number) {
  if (p.status !== 'active') return;
  const today = new Date(now);
  const from = new Date(Math.max(p.createdAt, now - 40 * DAY));
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate() - 1);
  const until = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  while (cursor <= until) {
    const w = p.schedule[weekdayIndex(cursor)];
    if (w) {
      const key = dateKey(cursor);
      const id = occId(p.id, key);
      const { start, end } = windowTimes(cursor, w);
      // 약속을 만들기 전에 이미 끝난 창은 만들지 않는다
      if (!d.occurrences[id] && end > p.createdAt) {
        d.occurrences[id] = {
          id,
          promiseId: p.id,
          date: key,
          start,
          end,
          status: 'upcoming',
          mission: KIND_MISSION[p.kind](id),
          submissionIds: [],
        };
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
}

/** 약속 수정 시 앞으로 열릴 창을 다시 만든다 */
export function regenerateFuture(d: Data, p: PromiseT, now: number) {
  for (const o of Object.values(d.occurrences)) {
    if (o.promiseId === p.id && o.status === 'upcoming' && o.start > now) delete d.occurrences[o.id];
  }
  generateOccurrences(d, p, now);
}

/** 놓친 날 확정: 금액 단계를 올리고 결제를 마감 24시간 뒤로 예약 (SPEC 2.3, 7.2 마감 처리) */
export function markMissed(d: Data, o: Occurrence, now: number, auto = false) {
  const p = d.promises[o.promiseId];
  o.status = 'missed';
  o.missedAt = now;
  const amount = stageAmount(p.missCount, p.maxAmount);
  p.missCount += 1;
  const charge: Charge = {
    id: newId('ch'),
    occurrenceId: o.id,
    promiseId: p.id,
    amount,
    scheduledAt: Math.max(o.end + CHARGE_DELAY_HOURS * HOUR, now + HOUR),
    status: 'scheduled',
  };
  d.charges[charge.id] = charge;
  o.chargeId = charge.id;
  pushEvent(d, auto ? 'auto_failed' : 'missed', now, { occurrenceId: o.id, promiseId: p.id });
}

export function markKept(d: Data, o: Occurrence, at: number) {
  o.status = 'kept';
  o.keptAt = at;
}

function resolveReview(d: Data, o: Occurrence, s: Submission, now: number) {
  s.review = d.dev.reviewResult;
  if (s.review === 'pass') markKept(d, o, s.takenAt);
  else markMissed(d, o, now);
  pushEvent(d, 'review_done', now, { occurrenceId: o.id, promiseId: o.promiseId });
}

/** 결제 시도 (가짜 PG) */
export function attemptCharge(d: Data, c: Charge, now: number) {
  if (c.amount === 0) {
    c.status = 'paid';
    c.paidAt = now;
    return;
  }
  if (!d.card || d.dev.nextChargeFails) {
    d.dev.nextChargeFails = false;
    c.status = 'failed';
    c.failedAt = now;
    if (!d.paymentFailedAt) d.paymentFailedAt = now;
    pushEvent(d, 'payment_failed', now, { chargeId: c.id, promiseId: c.promiseId });
    return;
  }
  c.status = 'paid';
  c.paidAt = now;
  pushEvent(d, 'charged', now, { chargeId: c.id, promiseId: c.promiseId });
}

/** 이의제기 결과 반영 (SPEC 2.4) */
export function resolveDispute(d: Data, disputeId: string, approve: boolean, now: number, denyReason?: string) {
  const dp = d.disputes[disputeId];
  const o = d.occurrences[dp.occurrenceId];
  const c = o.chargeId ? d.charges[o.chargeId] : undefined;
  const p = d.promises[o.promiseId];
  dp.resolvedAt = now;
  if (approve) {
    dp.status = 'approved';
    o.status = 'excused';
    if (c && c.status !== 'paid') {
      c.status = 'canceled';
      c.canceledAt = now;
    }
    // 금액 단계 유지: 이번 놓침으로 오른 단계를 되돌린다
    p.missCount = Math.max(0, p.missCount - 1);
  } else {
    dp.status = 'denied';
    dp.denyReason = denyReason ?? '제출한 사진에서 미션을 확인할 수 없었어요';
    if (c && (c.status === 'held' || c.status === 'scheduled')) {
      c.status = 'scheduled';
      c.scheduledAt = now + DENIED_CHARGE_DELAY_HOURS * HOUR;
    }
  }
  pushEvent(d, 'dispute_result', now, { occurrenceId: o.id, disputeId, promiseId: p.id });
}

/** 시간이 흐른 만큼 상태를 처리한다. 앱이 켜져 있는 동안 1초마다, 켤 때 한 번 부른다 */
export function tick(d: Data, now: number) {
  if (!d.user) return;
  for (const p of Object.values(d.promises)) generateOccurrences(d, p, now);

  for (const o of Object.values(d.occurrences)) {
    const p = d.promises[o.promiseId];
    if (!p) continue;
    if (o.status === 'upcoming' && now >= o.start && now < o.end) o.status = 'open';
    if ((o.status === 'upcoming' || o.status === 'open' || o.status === 'rejected') && now >= o.end) {
      if (p.status === 'ended') continue;
      // 제출 실패로 남아 있는 사진은 늦게 보내도 인정 (SPEC 2.2-5)
      const pendingUpload = o.submissionIds.map((id) => d.submissions[id]).find((s) => s?.uploadFailed);
      if (!pendingUpload) markMissed(d, o, now, p.method !== 'photo');
    }
    if (o.status === 'reviewing') {
      const s = d.submissions[o.submissionIds[o.submissionIds.length - 1]];
      if (s?.reviewDueAt && now >= s.reviewDueAt) resolveReview(d, o, s, now);
    }
  }

  for (const dp of Object.values(d.disputes)) {
    if (dp.status === 'reviewing' && now >= dp.dueAt) resolveDispute(d, dp.id, d.dev.disputeResult === 'approve', now);
  }

  for (const c of Object.values(d.charges)) {
    const o = d.occurrences[c.occurrenceId];
    const disputing = o?.disputeId && d.disputes[o.disputeId]?.status === 'reviewing';
    if (c.status === 'scheduled' && disputing) c.status = 'held';
    if (c.status === 'scheduled' && now >= c.scheduledAt) attemptCharge(d, c, now);
  }

  // 무료 체험 끝 → 구독 전환 (스토어 결제는 가짜)
  const pro = d.user.pro;
  if (pro.status === 'trial' && pro.trialEndsAt) {
    if (now >= pro.trialEndsAt) {
      pro.status = 'pro';
      pro.renewsAt = pro.trialEndsAt + (pro.plan === 'year' ? 365 : 30) * DAY;
    } else if (now >= pro.trialEndsAt - DAY && !d.events.some((e) => e.type === 'trial_ending' && e.at >= pro.trialEndsAt! - DAY)) {
      pushEvent(d, 'trial_ending', now);
    }
  }
}

/** 연속 기록: 가장 최근 끝난 창부터 거꾸로 지킨·쉰·면제 날을 센다 */
export function streakOf(d: Data, promiseId: string, now: number) {
  const list = Object.values(d.occurrences)
    .filter((o) => o.promiseId === promiseId && (o.end <= now || ['kept', 'paused', 'excused'].includes(o.status)))
    .sort((a, b) => b.start - a.start);
  let n = 0;
  for (const o of list) {
    if (o.status === 'kept' || o.status === 'excused') n++;
    else if (o.status === 'paused') continue;
    else if (o.status === 'reviewing') continue;
    else break;
  }
  return n;
}

/** 결제 실패 후 72시간이 지나면 새 약속을 만들 수 없다 (SPEC 2.3) */
export function isPaymentBlocked(d: Data, now: number) {
  const failed = Object.values(d.charges).some((c) => c.status === 'failed');
  return failed && !!d.paymentFailedAt && now >= d.paymentFailedAt + PAYMENT_GRACE_HOURS * HOUR;
}
