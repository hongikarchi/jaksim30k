/** 34. 헬스장 인증 실패: 머문 시간 미달 */
import { useLocalSearchParams } from 'expo-router';

import { KeyValueRow } from '../components';
import { clock } from '../domain/rules';
import { goHome } from '../lib/nav';
import { useNow, useStore } from '../store';
import { MissedLayout, buildMissedInfo, chargeWhenRow, missedActions, type MissedActions, type MissedInfo } from './Missed';
import { NotFound, paramOf } from './outcomeParts';

export type GymStay = { stayedMin?: number; activityAt?: number };

export function GymFailedView({
  info,
  stay,
  needMinutes,
  now,
  ...actions
}: { info: MissedInfo; stay?: GymStay; needMinutes: number; now: number } & MissedActions) {
  const m = stay?.stayedMin ?? 0;
  const [title, subtitle] =
    m === 0
      ? ['헬스장에 머문 기록이 없어요', `인증 시간 안에 ${needMinutes}분 머물러야 했어요`]
      : ['머문 시간이 모자랐어요', `${m}분 머물렀고, ${needMinutes}분이 필요했어요`];
  return (
    <MissedLayout
      info={info}
      now={now}
      title={title}
      subtitle={subtitle}
      actions={actions}
      rows={
        <>
          <KeyValueRow
            label="머문 시간"
            value={m === 0 ? '기록 없음' : stay?.activityAt ? `${m}분, ${clock(stay.activityAt)} 도착` : `${m}분`}
          />
          <KeyValueRow label="필요한 시간" value={`${needMinutes}분 이상`} />
          {chargeWhenRow(info, now, true)}
        </>
      }
    />
  );
}

export default function GymFailedRoute() {
  const occ = paramOf(useLocalSearchParams<{ occ: string }>().occ);
  const now = useNow();
  const d = useStore();
  const info = buildMissedInfo(d, occ);
  const o = d.occurrences[occ];
  const p = o && d.promises[o.promiseId];
  if (!info || !p) return <NotFound onHome={goHome} />;
  return (
    <GymFailedView
      info={info}
      stay={o.auto ? { stayedMin: o.auto.stayedMin, activityAt: o.auto.arrivedAt ?? o.auto.activityAt } : undefined}
      needMinutes={p.gym?.stayMinutes ?? 30}
      now={now}
      {...missedActions(occ, info)}
    />
  );
}
