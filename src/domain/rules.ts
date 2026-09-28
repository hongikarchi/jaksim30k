import type { HM, PromiseKind, PromiseT, Schedule, Window } from './types';

export const KIND_NAMES: Record<PromiseKind, string> = {
  morning: '미라클모닝',
  run: '러닝',
  gym: '헬스장',
  book: '책읽기',
  room: '방청소',
};

/** 약속 종류별 기본값 (SPEC 2.1). 요일은 월~일 */
export const PRESETS: Record<PromiseKind, { start: HM; end: HM; days: boolean[] }> = {
  morning: { start: { h: 6, m: 0 }, end: { h: 6, m: 10 }, days: [true, true, true, true, true, false, false] },
  run: { start: { h: 19, m: 0 }, end: { h: 22, m: 0 }, days: [true, false, true, false, true, false, false] },
  gym: { start: { h: 19, m: 0 }, end: { h: 23, m: 0 }, days: [true, false, true, false, true, false, false] },
  book: { start: { h: 0, m: 0 }, end: { h: 23, m: 59 }, days: [true, true, true, true, true, true, true] },
  room: { start: { h: 21, m: 0 }, end: { h: 23, m: 59 }, days: [true, true, true, true, true, true, true] },
};

export const presetSchedule = (kind: PromiseKind): Schedule => {
  const p = PRESETS[kind];
  return p.days.map((on) => (on ? { start: { ...p.start }, end: { ...p.end } } : null));
};

export const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

export const pad2 = (n: number) => String(n).padStart(2, '0');
export const fmtHM = (t: HM) => `${pad2(t.h)}:${pad2(t.m)}`;
export const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;
export const num = (n: number) => n.toLocaleString('ko-KR');

/** 금액 단계 (SPEC 2.3): 1번째 0원 → 5,000원 → 10,000원 → 최대 금액 */
export function stageAmount(missCount: number, max: number) {
  const steps = [0, Math.min(5000, max), Math.min(10000, max), max];
  return steps[Math.min(missCount, 3)];
}

/** 쉬어가기 한 달 횟수 (SPEC 2.5) */
export const pauseLimit = (pro: boolean) => (pro ? 4 : 1);

/** 월=0 … 일=6 */
export const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;

export const dateKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export const monthKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;

export function parseDateKey(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** 날짜 + 창 → 시작·끝 시각. 끝이 :59면 그 분 끝까지 인정, 끝이 시작보다 이르면 다음 날 */
export function windowTimes(date: Date, w: Window) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), w.start.h, w.start.m).getTime();
  let end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), w.end.h, w.end.m).getTime();
  if (w.end.m === 59) end += 59_999;
  if (end <= start) end += 24 * 3600_000;
  return { start, end };
}

/**
 * 좁은 창: 창 길이 1시간 이하 (미라클모닝처럼 짧게 열리는 약속).
 * 홈 큰 카드 순서와 "인증 창 열림" 알림에 쓴다.
 */
export const isNarrow = (start: number, end: number) => end - start <= 3600_000;

/** 요일 요약: 매일 / 평일 / 주말 / 월수금 */
export function daysSummary(schedule: Schedule) {
  const on = schedule.map((w) => !!w);
  const n = on.filter(Boolean).length;
  if (n === 7) return '매일';
  if (n === 5 && !on[5] && !on[6]) return '평일';
  if (n === 2 && on[5] && on[6]) return '주말';
  return DAY_LABELS.filter((_, i) => on[i]).join('');
}

/** 요일마다 시간이 다른지 */
export function isCustomSchedule(schedule: Schedule) {
  const ws = schedule.filter((w): w is Window => !!w);
  if (ws.length < 2) return false;
  const k = (w: Window) => fmtHM(w.start) + fmtHM(w.end);
  return ws.some((w) => k(w) !== k(ws[0]));
}

export function firstWindow(schedule: Schedule): Window | null {
  return schedule.find((w): w is Window => !!w) ?? null;
}

/** 목록에 쓰는 한 줄 설명: "평일 06:00–06:10" / "매일 23:59까지" */
export function scheduleSummary(schedule: Schedule) {
  const w = firstWindow(schedule);
  if (!w) return '요일 없음';
  if (isCustomSchedule(schedule)) return `${daysSummary(schedule)} 요일마다 다름`;
  const days = daysSummary(schedule);
  if (w.start.h === 0 && w.start.m === 0) return `${days} ${fmtHM(w.end)}까지`;
  return `${days} ${fmtHM(w.start)}–${fmtHM(w.end)}`;
}

export const promiseName = (p: Pick<PromiseT, 'kind'>) => KIND_NAMES[p.kind];

/** 미션 목록 (미라클모닝·헬스장 랜덤 미션) */
export const MISSIONS = [
  { full: '왼손으로 브이를 해주세요', short: '왼손으로 브이' },
  { full: '오른손 엄지를 들어주세요', short: '오른손 엄지 척' },
  { full: '손가락 세 개를 펴주세요', short: '손가락 세 개' },
  { full: '주먹을 쥐어 보여주세요', short: '주먹 쥐기' },
  { full: '손바닥을 활짝 펴주세요', short: '손바닥 펴기' },
  { full: '양손으로 하트를 만들어주세요', short: '양손 하트' },
];

export function missionFor(occurrenceId: string) {
  let h = 0;
  for (const c of occurrenceId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return MISSIONS[h % MISSIONS.length];
}

/** 약속 종류별 인증 안내 문구 */
export const KIND_MISSION: Record<PromiseKind, (occId: string) => string | undefined> = {
  morning: (id) => missionFor(id).full,
  gym: (id) => missionFor(id).full,
  book: () => '읽은 쪽 번호가 보이게 찍어주세요',
  room: () => '기준 사진과 같은 각도로 찍어주세요',
  run: () => undefined,
};

/** 남은 시간 표시: HH:MM:SS (99시간 넘으면 99:59:59) */
export function hms(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.min(99, Math.floor(s / 3600));
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(sec)}`;
}

/** MM:SS (한 시간 넘으면 HH:MM) */
export function shortRemain(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s >= 3600) return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}`;
  return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
}

export const clock = (t: number) => {
  const d = new Date(t);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
export const clockSec = (t: number) => {
  const d = new Date(t);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};

/** "오늘 06:10" / "내일 06:10" / "9월 3일 06:10" */
export function whenLabel(t: number, now: number) {
  const d = new Date(t);
  const today = new Date(now);
  const diffDays = Math.round(
    (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() -
      new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) /
      86400_000,
  );
  const day = diffDays === 0 ? '오늘' : diffDays === 1 ? '내일' : diffDays === -1 ? '어제' : `${d.getMonth() + 1}월 ${d.getDate()}일`;
  return `${day} ${clock(t)}`;
}

export const dayLabel = (t: number) => {
  const d = new Date(t);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
};

/** "3시간 12분" / "6분 33초" */
export function durationLabel(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return m ? `${h}시간 ${m}분` : `${h}시간`;
  if (m > 0) return s % 60 ? `${m}분 ${s % 60}초` : `${m}분`;
  return `${s}초`;
}

export const HOUR = 3600_000;
export const DAY = 24 * HOUR;
