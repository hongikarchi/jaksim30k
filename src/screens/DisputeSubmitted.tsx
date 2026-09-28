/** 36. 이의제기 접수: 오류 외 사유는 12시간 안에 사람이 확인 */
import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { BottomActions, Button, ClockCard, InfoCard, KeyValueRow, Screen } from '../components';
import { dayLabel, hms, won } from '../domain/rules';
import type { DisputeReason } from '../domain/types';
import { href } from '../lib/routes';
import { goHome, replace } from '../lib/nav';
import { useNow, useStore } from '../store';
import { DISPUTE_REVIEW_HOURS } from '../store/engine';
import { promiseTitle } from '../store/selectors';
import { NotFound, WhiteRows, paramOf, reasonShort } from './outcomeParts';

export type DisputeSubmittedModel = {
  name: string;
  date: number;
  reason: DisputeReason;
  dueAt: number;
  amount: number;
};

export function DisputeSubmittedView({ model: m, now, onHome }: { model: DisputeSubmittedModel; now: number; onHome: () => void }) {
  return (
    <Screen
      topGap="wide"
      gap={16}
      footer={
        <BottomActions>
          <Button label="홈으로" onPress={onHome} />
        </BottomActions>
      }
    >
      <ClockCard
        label="답변 예정까지"
        name={m.name}
        digits={hms(m.dueAt - now)}
        digitsColor="surface"
        title="이의제기를 접수했어요"
        subtitle={`접수한 때부터 ${DISPUTE_REVIEW_HOURS}시간 안에 결과를 알려드려요`}
      />
      <WhiteRows>
        <KeyValueRow label="약속" value={`${m.name}, ${dayLabel(m.date)}`} />
        <KeyValueRow label="사유" value={reasonShort(m.reason)} />
        <KeyValueRow label="결제" value={m.amount === 0 ? '0원이라 결제 없음' : `${won(m.amount)} 멈춤`} last />
      </WhiteRows>
      <InfoCard icon="bell">결과가 나오면 알림으로 알려드려요. 그동안은 결제되지 않아요.</InfoCard>
    </Screen>
  );
}

export default function DisputeSubmittedRoute() {
  const dpId = paramOf(useLocalSearchParams<{ dp: string }>().dp);
  const now = useNow();
  const d = useStore();
  const dp = d.disputes[dpId];
  const o = dp && d.occurrences[dp.occurrenceId];
  const p = o && d.promises[o.promiseId];
  const c = o?.chargeId ? d.charges[o.chargeId] : undefined;

  // 결과가 나오면 결과 화면으로
  const resolved = !!dp && dp.status !== 'reviewing';
  useEffect(() => {
    if (resolved) replace(href.disputeResult(dpId));
  }, [resolved, dpId]);

  if (!dp || !o || !p) return <NotFound onHome={goHome} />;
  return (
    <DisputeSubmittedView
      model={{ name: promiseTitle(p), date: o.start, reason: dp.reason, dueAt: dp.dueAt, amount: c?.amount ?? 0 }}
      now={now}
      onHome={goHome}
    />
  );
}
