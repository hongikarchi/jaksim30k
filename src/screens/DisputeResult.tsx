/** 37·38. 이의제기 결과: 승인 / 거절 */
import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { BottomActions, Button, KeyValueRow, Screen, Text, TextButton, Title } from '../components';
import { dayLabel, whenLabel, won, stageAmount } from '../domain/rules';
import type { DisputeReason } from '../domain/types';
import { href } from '../lib/routes';
import { go, goHome, replace } from '../lib/nav';
import { useNow, useStore } from '../store';
import { promiseTitle } from '../store/selectors';
import { colors } from '../theme';
import {
  AmountRow,
  GroundRows,
  IconCircle,
  NotFound,
  dayWord,
  eunNeun,
  paramOf,
  reasonShort,
  type OutcomeCharge,
} from './outcomeParts';

export type DisputeResultModel = {
  status: 'approved' | 'denied';
  name: string;
  date: number;
  reason: DisputeReason;
  denyReason?: string;
  charge?: OutcomeCharge;
  nextAmount: number;
};

export function DisputeResultView({
  model: m,
  now,
  onHome,
  onSupport,
}: {
  model: DisputeResultModel;
  now: number;
  onHome: () => void;
  onSupport: () => void;
}) {
  const approved = m.status === 'approved';
  const c = m.charge;
  const day = dayWord(m.date, now);

  return (
    <Screen
      topGap="wide"
      wide
      gap={24}
      scroll
      footer={
        <BottomActions>
          {approved ? null : <TextButton label="결과가 이상하면 문의하기" onPress={onSupport} />}
          <Button label="확인" onPress={onHome} />
        </BottomActions>
      }
    >
      <IconCircle tone={approved ? 'ink' : 'signal'} icon={approved ? 'check' : 'close'} />
      {approved ? (
        <Title sub={`결제하지 않고, ${day}${eunNeun(day)} 지킨 날로 기록할게요.`}>{'이의제기가\n받아들여졌어요'}</Title>
      ) : (
        <Title sub="확인한 내용을 알려드릴게요.">{'이의제기가\n받아들여지지 않았어요'}</Title>
      )}
      {approved ? null : (
        <View style={{ gap: 6, paddingVertical: 16, paddingHorizontal: 18, borderRadius: 14, backgroundColor: colors.surface }}>
          <Text size={13} weight="bold">
            확인 결과
          </Text>
          <Text size={14} color="textBody" body>
            {m.denyReason ?? '제출한 기록으로는 약속을 지킨 것을 확인할 수 없었어요.'}
          </Text>
        </View>
      )}
      <GroundRows>
        {approved ? (
          <>
            <AmountRow
              label={c?.status === 'paid' ? '결제된 금액' : '취소된 금액'}
              amount={won(c?.amount ?? 0)}
              strike={c?.status !== 'paid'}
            />
            <KeyValueRow onGround label="약속" value={`${m.name}, ${dayLabel(m.date)}`} />
            <KeyValueRow onGround label="사유" value={reasonShort(m.reason)} />
            <KeyValueRow onGround label="다음에 어기면" value={`${won(m.nextAmount)} 그대로`} />
            <KeyValueRow onGround label="연속 성공" value="끊기지 않았어요" />
          </>
        ) : (
          <>
            <AmountRow label={c?.status === 'paid' ? '결제된 금액' : '결제될 금액'} amount={won(c?.amount ?? 0)} />
            {c?.status === 'paid' ? (
              <KeyValueRow onGround label="결제한 때" value={c.paidAt ? whenLabel(c.paidAt, now) : '결제 완료'} />
            ) : c?.status === 'failed' ? (
              <KeyValueRow onGround label="결제" value="실패, 카드 확인 필요" />
            ) : (
              <KeyValueRow onGround label="결제 예정" value={c ? whenLabel(c.scheduledAt, now) : '없음'} />
            )}
            <KeyValueRow onGround label="다음에 어기면" value={won(m.nextAmount)} />
          </>
        )}
      </GroundRows>
    </Screen>
  );
}

export default function DisputeResultRoute() {
  const dpId = paramOf(useLocalSearchParams<{ dp: string }>().dp);
  const now = useNow();
  const d = useStore();
  const dp = d.disputes[dpId];
  const o = dp && d.occurrences[dp.occurrenceId];
  const p = o && d.promises[o.promiseId];
  const c = o?.chargeId ? d.charges[o.chargeId] : undefined;

  // 아직 검토 중이면 접수 화면으로
  const reviewing = dp?.status === 'reviewing';
  useEffect(() => {
    if (reviewing) replace(href.disputeSubmitted(dpId));
  }, [reviewing, dpId]);

  if (!dp || !o || !p) return <NotFound onHome={goHome} />;
  if (dp.status === 'reviewing') return null;
  return (
    <DisputeResultView
      model={{
        status: dp.status,
        name: promiseTitle(p),
        date: o.start,
        reason: dp.reason,
        denyReason: dp.denyReason,
        charge: c && { amount: c.amount, scheduledAt: c.scheduledAt, status: c.status, paidAt: c.paidAt },
        nextAmount: stageAmount(p.missCount, p.maxAmount),
      }}
      now={now}
      onHome={goHome}
      onSupport={() => go(href.support)}
    />
  );
}
