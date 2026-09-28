/** 33. 러닝 인증 실패: 거리 미달·기록 없음·수동 입력 */
import { useLocalSearchParams } from 'expo-router';

import { KeyValueRow } from '../components';
import { clock } from '../domain/rules';
import { goHome } from '../lib/nav';
import { useNow, useStore } from '../store';
import { RUN_MIN_KM } from '../store/engine';
import { MissedLayout, buildMissedInfo, chargeWhenRow, missedActions, type MissedActions, type MissedInfo } from './Missed';
import { NotFound, paramOf } from './outcomeParts';

export type RunRecord = { distanceKm?: number; manual?: boolean; activityAt?: number };

export const km = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(1)}km`;

/** 확인된 기록 한 줄: "3.2km, 19:40" / "6km, 수동 입력" / "기록 없음" */
export function runRecordLabel(r: RunRecord | undefined, emptyLabel = '기록 없음') {
  if (r?.distanceKm === undefined) return emptyLabel;
  if (r.manual) return `${km(r.distanceKm)}, 수동 입력`;
  return r.activityAt ? `${km(r.distanceKm)}, ${clock(r.activityAt)}` : km(r.distanceKm);
}

export function RunFailedView({
  info,
  run,
  now,
  ...actions
}: { info: MissedInfo; run?: RunRecord; now: number } & MissedActions) {
  const d = run?.distanceKm;
  const [title, subtitle] =
    d === undefined
      ? ['러닝 기록이 없었어요', '인증 시간 안에 스트라바 기록이 올라오지 않았어요']
      : run?.manual
        ? ['수동 입력 기록은 인정되지 않아요', `${km(d)}를 직접 입력한 기록이라 인정되지 않았어요`]
        : ['러닝 거리가 모자랐어요', `${km(d)}를 달렸고, ${RUN_MIN_KM}km가 필요했어요`];
  return (
    <MissedLayout
      info={info}
      now={now}
      title={title}
      subtitle={subtitle}
      actions={actions}
      rows={
        <>
          <KeyValueRow label="확인된 기록" value={runRecordLabel(run)} />
          <KeyValueRow label="필요한 거리" value={`${RUN_MIN_KM}km 이상`} />
          {chargeWhenRow(info, now, true)}
        </>
      }
    />
  );
}

export default function RunFailedRoute() {
  const occ = paramOf(useLocalSearchParams<{ occ: string }>().occ);
  const now = useNow();
  const d = useStore();
  const info = buildMissedInfo(d, occ);
  if (!info) return <NotFound onHome={goHome} />;
  return <RunFailedView info={info} run={d.occurrences[occ]?.auto} now={now} {...missedActions(occ, info)} />;
}
