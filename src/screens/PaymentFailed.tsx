/** 39. 결제 실패: 72시간 안에 카드를 바꾸지 않으면 새 약속을 만들 수 없다 (SPEC 2.3) */
import { useState } from 'react';
import { View } from 'react-native';

import { BottomActions, Button, DotText, KeyValueRow, Screen, Text, TextButton, Title } from '../components';
import { HOUR, dayLabel, pad2, won } from '../domain/rules';
import { href } from '../lib/routes';
import { go, goHome } from '../lib/nav';
import { useNow, useStore, type Data } from '../store';
import { PAYMENT_GRACE_HOURS } from '../store/engine';
import { cardLabel, promiseTitle } from '../store/selectors';
import { colors } from '../theme';
import { AmountRow, GroundRows, IconCircle } from './outcomeParts';

export type PaymentItem = { id: string; name: string; date: number; amount: number };

export type PaymentFailedModel =
  | { variant: 'failed'; items: PaymentItem[]; card: string; deadline?: number }
  | { variant: 'resolved'; items: PaymentItem[]; card: string };

/** 72:00 → "71:48" (시:분) */
const hoursMinutes = (ms: number) => {
  const m = Math.max(0, Math.floor(ms / 60_000));
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
};

export function PaymentFailedView({
  model,
  now,
  onChangeCard,
  onHome,
}: {
  model: PaymentFailedModel;
  now: number;
  onChangeCard: () => void;
  onHome: () => void;
}) {
  const total = model.items.reduce((a, i) => a + i.amount, 0);
  const itemRows = () =>
    model.items.length === 1 ? (
      <KeyValueRow onGround label="약속" value={`${model.items[0].name}, ${dayLabel(model.items[0].date)}`} />
    ) : (
      model.items.map((i) => (
        <KeyValueRow key={i.id} onGround label={`${i.name}, ${dayLabel(i.date)}`} value={won(i.amount)} />
      ))
    );

  if (model.variant === 'resolved')
    return (
      <Screen
        topGap="wide"
        wide
        gap={24}
        scroll
        footer={
          <BottomActions>
            <Button label="홈으로" onPress={onHome} />
          </BottomActions>
        }
      >
        <IconCircle tone="ink" icon="check" />
        <Title sub="이제 새 약속을 만들 수 있어요.">
          {model.items.length ? '밀린 금액을 결제했어요' : '밀린 금액이 없어요'}
        </Title>
        {model.items.length ? (
          <GroundRows>
            <AmountRow label="결제한 금액" amount={won(total)} />
            {itemRows()}
            <KeyValueRow onGround label="결제한 카드" value={model.card} />
          </GroundRows>
        ) : null}
      </Screen>
    );

  const left = model.deadline !== undefined ? model.deadline - now : undefined;
  const blocked = left !== undefined && left <= 0;
  return (
    <Screen
      topGap="wide"
      wide
      gap={24}
      scroll
      footer={
        <BottomActions>
          <TextButton label="나중에 할게요" onPress={onHome} />
          <Button label="카드 바꾸고 다시 결제" onPress={onChangeCard} />
        </BottomActions>
      }
    >
      <IconCircle tone="signal" icon="cardFailed" />
      <Title sub="카드 한도나 유효기간을 확인해 주세요.">결제가 되지 않았어요</Title>
      <GroundRows>
        <AmountRow label="결제할 금액" amount={won(total)} />
        {itemRows()}
        <KeyValueRow onGround label="등록된 카드" value={model.card} />
      </GroundRows>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 18,
          paddingHorizontal: 20,
          borderRadius: 18,
          backgroundColor: colors.ink,
        }}
      >
        <View style={{ gap: 2, flex: 1 }}>
          <Text size={14} weight="semibold" color="surface">
            {blocked ? '지금은 새 약속을 만들 수 없어요' : '카드를 바꾸지 않으면'}
          </Text>
          <Text size={13} color="textOnInk">
            {blocked ? '카드를 바꾸면 바로 다시 만들 수 있어요' : '새 약속을 만들 수 없어요'}
          </Text>
        </View>
        {left !== undefined && !blocked ? (
          <View style={{ alignItems: 'flex-end' }}>
            <DotText size={28} color="signal">
              {hoursMinutes(left)}
            </DotText>
            <Text size={11} color="textOnInk">
              남음
            </Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const itemOf = (d: Data, id: string): PaymentItem | null => {
  const c = d.charges[id];
  const o = c && d.occurrences[c.occurrenceId];
  const p = c && d.promises[c.promiseId];
  if (!c || !p) return null;
  return { id, name: promiseTitle(p), date: o?.start ?? c.scheduledAt, amount: c.amount };
};

export default function PaymentFailedRoute() {
  const now = useNow();
  const d = useStore();
  const failedIds = Object.values(d.charges)
    .filter((c) => c.status === 'failed')
    .sort((a, b) => a.scheduledAt - b.scheduledAt)
    .map((c) => c.id);
  // 들어올 때 실패였던 결제: 카드를 바꾼 뒤 결제된 목록으로 보여준다
  const [initialIds] = useState(failedIds);
  const card = cardLabel(d);

  const model: PaymentFailedModel =
    failedIds.length > 0
      ? {
          variant: 'failed',
          items: failedIds.map((id) => itemOf(d, id)).filter((x): x is PaymentItem => !!x),
          card,
          deadline: d.paymentFailedAt !== undefined ? d.paymentFailedAt + PAYMENT_GRACE_HOURS * HOUR : undefined,
        }
      : {
          variant: 'resolved',
          items: initialIds
            .filter((id) => d.charges[id]?.status === 'paid')
            .map((id) => itemOf(d, id))
            .filter((x): x is PaymentItem => !!x),
          card,
        };

  return <PaymentFailedView model={model} now={now} onChangeCard={() => go(href.pg('change'))} onHome={goHome} />;
}
