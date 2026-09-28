/**
 * 개발용 예시 데이터. 화면 갤러리·스크린샷·개발 메뉴에서 특정 상황을 바로 만들어 본다.
 * 기준 날짜를 정해두고(2026-09-28 월요일) devOffset으로 앱 안의 시각을 그 날짜로 옮긴다.
 */
import { DAY, HOUR, presetSchedule, stageAmount } from '../domain/rules';
import type { PromiseKind, PromiseT } from '../domain/types';
import { initialData, type Data } from '../store/data';
import { generateOccurrences, newId, tick } from '../store/engine';

const at = (y: number, mo: number, d: number, h: number, mi: number, s = 0) => new Date(y, mo - 1, d, h, mi, s).getTime();

export const SCENARIOS = {
  new: '처음 실행 (로그인 전)',
  empty: '약속 없음',
  waiting: '홈: 대기 (월 22:17)',
  open: '홈: 미라클모닝 창 열림 (화 06:02)',
  multi: '홈: 여러 약속 열림 (수 21:10)',
  missed: '놓친 날 (화 06:11)',
  paymentFailed: '결제 실패',
  pro: '프로 사용자, 감시자 연결',
} as const;

export type ScenarioName = keyof typeof SCENARIOS;

function base(now: number): Data {
  const d = initialData();
  d.devOffset = now - Date.now();
  d.user = {
    provider: 'kakao',
    name: '카카오 사용자',
    createdAt: now - 40 * DAY,
    permissions: { notifications: true, camera: true, location: false },
    pro: { status: 'free' },
    stravaConnected: false,
  };
  d.card = { company: '신한카드', last4: '4821', registeredAt: now - 40 * DAY };
  return d;
}

function addPromise(d: Data, kind: PromiseKind, createdAt: number, extra: Partial<PromiseT> = {}) {
  const p: PromiseT = {
    id: newId('pr'),
    kind,
    schedule: presetSchedule(kind),
    method: kind === 'run' ? 'strava' : 'photo',
    maxAmount: kind === 'gym' ? 10000 : 30000,
    missCount: 0,
    status: 'active',
    createdAt,
    pausesByMonth: {},
    ...extra,
  };
  if (kind === 'gym' && !p.gym) p.gym = { placeName: '스포애니 합정점', stayMinutes: 30 };
  if (kind === 'room' && !p.room) p.room = { checklist: ['바닥에 물건 없음', '침구 정리'] };
  d.promises[p.id] = p;
  return p;
}

/** 지난 창을 채운다: 대부분 지킴, missDays에 해당하는 날은 놓침(결제 완료) */
function fillHistory(d: Data, p: PromiseT, now: number, missDates: string[] = [], pauseDates: string[] = []) {
  generateOccurrences(d, p, now);
  for (const o of Object.values(d.occurrences)) {
    if (o.promiseId !== p.id || o.end > now) continue;
    if (pauseDates.includes(o.date)) {
      o.status = 'paused';
      continue;
    }
    if (missDates.includes(o.date)) {
      o.status = 'missed';
      o.missedAt = o.end;
      const amount = stageAmount(p.missCount, p.maxAmount);
      p.missCount += 1;
      const id = newId('ch');
      d.charges[id] = {
        id,
        occurrenceId: o.id,
        promiseId: p.id,
        amount,
        scheduledAt: o.end + 24 * HOUR,
        status: 'paid',
        paidAt: o.end + 24 * HOUR,
      };
      o.chargeId = id;
    } else {
      o.status = 'kept';
      o.keptAt = o.start + Math.min(3 * 60_000, (o.end - o.start) / 2);
    }
  }
}

const occOf = (d: Data, p: PromiseT, date: string) => d.occurrences[`${p.id}:${date}`];

export function buildScenario(name: ScenarioName): Data {
  if (name === 'new') return initialData();

  if (name === 'empty') {
    const now = at(2026, 9, 28, 22, 17, 50);
    const d = base(now);
    const p = addPromise(d, 'morning', now - 30 * DAY);
    fillHistory(d, p, now - 5 * DAY);
    p.status = 'ended';
    p.endedAt = now - 5 * DAY;
    for (const o of Object.values(d.occurrences)) if (o.status === 'upcoming' || o.status === 'open') delete d.occurrences[o.id];
    return d;
  }

  if (name === 'waiting') {
    const now = at(2026, 9, 28, 22, 17, 50);
    const d = base(now);
    const m = addPromise(d, 'morning', at(2026, 8, 31, 12, 0), { maxAmount: 30000 });
    fillHistory(d, m, now, ['2026-09-03']);
    const b = addPromise(d, 'book', at(2026, 9, 10, 12, 0));
    fillHistory(d, b, now, ['2026-09-12']);
    const bt = occOf(d, b, '2026-09-28');
    bt.status = 'kept';
    bt.keptAt = at(2026, 9, 28, 21, 30);
    const g = addPromise(d, 'gym', at(2026, 9, 7, 12, 0));
    fillHistory(d, g, at(2026, 9, 28, 0, 0), ['2026-09-09', '2026-09-16']);
    g.pausesByMonth['2026-09'] = 1;
    occOf(d, g, '2026-09-28').status = 'paused';
    tick(d, now);
    return d;
  }

  if (name === 'open' || name === 'missed') {
    const now = name === 'open' ? at(2026, 9, 29, 6, 2, 18) : at(2026, 9, 29, 6, 11, 48);
    const d = base(now);
    const m = addPromise(d, 'morning', at(2026, 8, 31, 12, 0));
    fillHistory(d, m, at(2026, 9, 29, 0, 0), ['2026-09-03']);
    const b = addPromise(d, 'book', at(2026, 9, 10, 12, 0));
    fillHistory(d, b, at(2026, 9, 29, 0, 0), ['2026-09-12']);
    const g = addPromise(d, 'gym', at(2026, 9, 7, 12, 0));
    fillHistory(d, g, now, ['2026-09-09', '2026-09-16']);
    // 책읽기는 오늘 벌써 지킴
    const bo = occOf(d, b, '2026-09-29');
    if (bo) {
      bo.status = 'kept';
      bo.keptAt = at(2026, 9, 29, 0, 40);
    }
    tick(d, now);
    return d;
  }

  if (name === 'multi') {
    const now = at(2026, 9, 30, 21, 10, 30);
    const d = base(now);
    d.user!.pro = { status: 'pro', plan: 'month', startedAt: now - 20 * DAY, renewsAt: now + 10 * DAY };
    d.user!.stravaConnected = true;
    const g = addPromise(d, 'gym', at(2026, 9, 7, 12, 0));
    fillHistory(d, g, at(2026, 9, 30, 0, 0), ['2026-09-09', '2026-09-16']);
    const r = addPromise(d, 'run', at(2026, 9, 14, 12, 0), { maxAmount: 20000 });
    fillHistory(d, r, at(2026, 9, 30, 0, 0));
    const b = addPromise(d, 'book', at(2026, 9, 10, 12, 0));
    fillHistory(d, b, at(2026, 9, 30, 0, 0), ['2026-09-12']);
    const m = addPromise(d, 'morning', at(2026, 8, 31, 12, 0));
    fillHistory(d, m, now, ['2026-09-03']);
    tick(d, now);
    return d;
  }

  if (name === 'paymentFailed') {
    const now = at(2026, 9, 29, 9, 0, 0);
    const d = base(now);
    const m = addPromise(d, 'morning', at(2026, 8, 31, 12, 0));
    fillHistory(d, m, now, ['2026-09-03', '2026-09-28']);
    const o = occOf(d, m, '2026-09-28');
    const c = d.charges[o.chargeId!];
    c.status = 'failed';
    c.paidAt = undefined;
    c.failedAt = now - 2 * HOUR;
    d.paymentFailedAt = now - 2 * HOUR;
    d.events.push({ id: newId('ev'), type: 'payment_failed', at: now - 2 * HOUR, chargeId: c.id, promiseId: m.id, seen: false });
    tick(d, now);
    return d;
  }

  // pro
  const now = at(2026, 9, 28, 22, 17, 50);
  const d = base(now);
  d.user!.pro = { status: 'trial', plan: 'month', startedAt: now - 2 * DAY, trialEndsAt: now + 5 * DAY };
  const m = addPromise(d, 'morning', at(2026, 8, 31, 12, 0));
  fillHistory(d, m, now, ['2026-09-03']);
  m.watcher = { name: '김지수', scope: 'missed', status: 'connected', invitedAt: now - 3 * DAY, connectedAt: now - 3 * DAY };
  tick(d, now);
  return d;
}
