/** 화면에서 쓰는 계산 모음. 데이터는 바꾸지 않는다 */
import {
  DAY_LABELS,
  HOUR,
  KIND_NAMES,
  clock,
  dateKey,
  isNarrow,
  parseDateKey,
  scheduleSummary,
  stageAmount,
  whenLabel,
  won,
} from '../domain/rules';
import type { Occurrence, PromiseT } from '../domain/types';
import type { Data } from './data';

export const activePromises = (d: Data) =>
  Object.values(d.promises)
    .filter((p) => p.status === 'active')
    .sort((a, b) => a.createdAt - b.createdAt);

export const occurrencesOf = (d: Data, promiseId: string) =>
  Object.values(d.occurrences)
    .filter((o) => o.promiseId === promiseId)
    .sort((a, b) => a.start - b.start);

/** 지금 걸려 있는 금액 (다음에 놓치면 낼 금액) */
export const stakeOf = (p: PromiseT) => stageAmount(p.missCount, p.maxAmount);

/** 약속의 "지금" 창: 열려 있거나 판정 중인 창 → 오늘 끝난 창 → 다음 창 */
export function currentOccurrence(d: Data, promiseId: string, now: number): Occurrence | undefined {
  const list = occurrencesOf(d, promiseId);
  const live = list.find((o) => o.start <= now && now < o.end);
  if (live) return live;
  const today = dateKey(new Date(now));
  const todayDone = [...list].reverse().find((o) => o.date === today && o.end <= now);
  if (todayDone && ['kept', 'reviewing', 'judging', 'excused'].includes(todayDone.status)) return todayDone;
  return list.find((o) => o.start > now && o.status !== 'paused') ?? todayDone;
}

export const nextOccurrence = (d: Data, promiseId: string, now: number) =>
  occurrencesOf(d, promiseId).find((o) => o.start > now && o.status === 'upcoming');

/** 인증할 수 있는 창인지 (열려 있고 아직 지키지 않음) */
export const canVerify = (o: Occurrence | undefined, now: number) =>
  !!o && now >= o.start && now < o.end && ['open', 'rejected', 'upcoming'].includes(o.status);

/** "다음 월요일", "내일 06:00" */
export function nextLabel(o: Occurrence, now: number) {
  const days = Math.round(
    (parseDateKey(o.date).getTime() - parseDateKey(dateKey(new Date(now))).getTime()) / (24 * HOUR),
  );
  if (days <= 1) return whenLabel(o.start, now);
  const wd = DAY_LABELS[(new Date(o.start).getDay() + 6) % 7];
  return days < 7 ? `${wd}요일 ${clock(o.start)}` : `다음 ${wd}요일`;
}

export type RowState =
  | { kind: 'verify' } // 지금 인증
  | { kind: 'checking' } // 자동 인증 확인 중
  | { kind: 'judging' }
  | { kind: 'reviewing' }
  | { kind: 'rejected' }
  | { kind: 'kept' }
  | { kind: 'missed' }
  | { kind: 'paused'; next?: string }
  | { kind: 'waiting'; at: number; label: string };

export function rowState(d: Data, p: PromiseT, now: number): { state: RowState; occ?: Occurrence } {
  const o = currentOccurrence(d, p.id, now);
  if (!o) return { state: { kind: 'waiting', at: 0, label: '' } };
  const live = now >= o.start && now < o.end;
  if (o.status === 'kept' || o.status === 'excused') return { state: { kind: 'kept' }, occ: o };
  if (o.status === 'reviewing') return { state: { kind: 'reviewing' }, occ: o };
  if (o.status === 'judging') return { state: { kind: 'judging' }, occ: o };
  if (o.status === 'rejected' && live) return { state: { kind: 'rejected' }, occ: o };
  if (o.status === 'missed') return { state: { kind: 'missed' }, occ: o };
  if (o.status === 'paused') {
    const n = nextOccurrence(d, p.id, now);
    return { state: { kind: 'paused', next: n ? nextLabel(n, now) : undefined }, occ: o };
  }
  if (live) return { state: p.method === 'photo' ? { kind: 'verify' } : { kind: 'checking' }, occ: o };
  return { state: { kind: 'waiting', at: o.start, label: nextLabel(o, now) }, occ: o };
}

export type Feature = {
  promise: PromiseT;
  occ: Occurrence;
  /** open = 지금 열린 창, due = 마감 3시간 안, next = 다음에 열릴 창 */
  mode: 'open' | 'due' | 'next';
};

/**
 * 홈 큰 카드에 띄울 약속 (SPEC 4.2):
 * 지금 열린 좁은 창 → 마감 3시간 안의 넓은 창 → 다음에 열릴 약속
 */
export function homeFeature(d: Data, now: number): { feature?: Feature; openCount: number } {
  const ps = activePromises(d);
  const live: Feature[] = [];
  const next: Feature[] = [];
  for (const p of ps) {
    const o = currentOccurrence(d, p.id, now);
    if (!o) continue;
    const pending = ['open', 'rejected', 'upcoming'].includes(o.status);
    if (now >= o.start && now < o.end && pending) live.push({ promise: p, occ: o, mode: 'open' });
    const n = nextOccurrence(d, p.id, now);
    if (n) next.push({ promise: p, occ: n, mode: 'next' });
  }
  const narrow = live.filter((f) => isNarrow(f.occ.start, f.occ.end)).sort((a, b) => a.occ.end - b.occ.end);
  const due = live
    .filter((f) => !isNarrow(f.occ.start, f.occ.end) && f.occ.end - now <= 3 * HOUR)
    .sort((a, b) => a.occ.end - b.occ.end)
    .map((f) => ({ ...f, mode: 'due' as const }));
  next.sort((a, b) => a.occ.start - b.occ.start);
  const feature = narrow[0] ?? due[0] ?? next[0];
  return { feature, openCount: live.filter((f) => f.promise.method === 'photo').length };
}

/** 목록 줄 설명: "평일 06:00–06:10 · 5,000원" */
export const promiseSubtitle = (p: PromiseT) => `${scheduleSummary(p.schedule)} · ${won(stakeOf(p))}`;

export const promiseTitle = (p: PromiseT) => KIND_NAMES[p.kind];

/** 이번 달 지킨 날·낸 금액 */
export function monthStats(d: Data, promiseId: string, year: number, month: number, now: number) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const occ = occurrencesOf(d, promiseId).filter((o) => o.date.startsWith(prefix) && o.end <= now);
  const counted = occ.filter((o) => o.status !== 'paused');
  const kept = counted.filter((o) => o.status === 'kept' || o.status === 'excused').length;
  const paid = Object.values(d.charges)
    .filter((c) => c.promiseId === promiseId && c.status === 'paid' && c.paidAt)
    .filter((c) => {
      const t = new Date(c.paidAt!);
      return t.getFullYear() === year && t.getMonth() + 1 === month;
    })
    .reduce((a, c) => a + c.amount, 0);
  return { kept, total: counted.length, paid };
}

/** 누적 지킨 날 (모든 약속) */
export const totalKeptDays = (d: Data) =>
  new Set(
    Object.values(d.occurrences)
      .filter((o) => o.status === 'kept' || o.status === 'excused')
      .map((o) => o.date),
  ).size;

export const cardLabel = (d: Data) => (d.card ? `${d.card.company} •••• ${d.card.last4}` : '등록된 카드 없음');

export const isPro = (d: Data) => !!d.user && d.user.pro.status !== 'free';

/** 아직 보지 않은, 화면으로 띄워야 하는 사건 */
export function pendingEvent(d: Data) {
  const important = ['payment_failed', 'missed', 'auto_failed', 'dispute_result', 'review_done', 'watcher_connected'];
  return d.events.find((e) => !e.seen && important.includes(e.type));
}

export const latestSubmission = (d: Data, o: Occurrence | undefined) =>
  o ? d.submissions[o.submissionIds[o.submissionIds.length - 1]] : undefined;
