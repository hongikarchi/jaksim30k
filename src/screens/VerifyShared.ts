/** 인증 갈래 화면(19~31)이 함께 쓰는 작은 계산 */
import { MISSIONS } from '../domain/rules';
import type { Occurrence, PromiseKind } from '../domain/types';

/** 주소 인자를 한 번 풀어준다 (이미 풀린 값이면 그대로) */
export function param(v: string | string[] | undefined) {
  const s = Array.isArray(v) ? v[0] : v;
  if (!s) return '';
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/** 사진 카드에 들어갈 짧은 미션 이름 */
export function missionShort(kind: PromiseKind | undefined, mission: string | undefined) {
  if (kind === 'book') return '쪽 번호가 보이게';
  if (kind === 'room') return '기준 사진과 같은 각도';
  if (!mission) return '-';
  return MISSIONS.find((m) => m.full === mission)?.short ?? mission;
}

/** 아직 사진을 받을 수 있는 창인지 (열려 있고 지키거나 놓치기 전) */
export const acceptsPhoto = (o: Occurrence | undefined, now: number) =>
  !!o && now >= o.start && now < o.end && ['open', 'rejected', 'upcoming'].includes(o.status);

/** 이 화면에서 결과를 이미 보여줬으니, 같은 창의 알림 사건은 본 것으로 (홈에서 한 번 더 띄우지 않게) */
export function markOccEventsSeen(
  d: { events: { id: string; occurrenceId?: string; seen: boolean; type: string }[]; markSeen: (id: string) => void },
  occurrenceId: string,
  types: string[],
) {
  for (const e of d.events) if (!e.seen && e.occurrenceId === occurrenceId && types.includes(e.type)) d.markSeen(e.id);
}
