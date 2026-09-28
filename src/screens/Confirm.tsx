/** 12. 확인과 카드 등록 (카드 없음) / 13. 확인 (카드 등록 후) */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import {
  BottomActions,
  Button,
  CheckRow,
  Header,
  Icon,
  KeyValueRow,
  PillButton,
  Screen,
  Text,
  Title,
} from '../components';
import { KIND_NAMES, scheduleSummary, stageAmount, won } from '../domain/rules';
import type { Draft } from '../domain/types';
import { goHome, go, replace } from '../lib/nav';
import { href } from '../lib/routes';
import { useNow, useStore } from '../store';
import { isPaymentBlocked } from '../store/engine';
import { colors } from '../theme';
import { NoDraftView } from './Stake';

export type ConfirmSummary = {
  name: string;
  schedule: string;
  method: string;
  /** 처음 어기면 */
  first: string;
  /** 그다음부터: 5,000원 → 30,000원 */
  then: string;
};

/** 인증 방식 한 줄 */
export function methodLabel(d: Pick<Draft, 'kind' | 'method'>) {
  if (d.method === 'strava') return '스트라바 기록 자동 인증';
  if (d.method === 'location') return '위치 자동 인증';
  switch (d.kind) {
    case 'book':
      return '쪽 번호 사진 + 한 줄 기록';
    case 'room':
      return '기준 사진과 같은 각도로 촬영';
    default:
      return '사진 촬영 + 랜덤 미션';
  }
}

/** 금액 단계 요약: 5,000원 → 30,000원 */
export const stakeRange = (max: number) => `${won(stageAmount(1, max))} → ${won(max)}`;

export function summaryOf(d: Draft): ConfirmSummary {
  return {
    name: KIND_NAMES[d.kind],
    schedule: scheduleSummary(d.schedule),
    method: methodLabel(d),
    first: won(stageAmount(0, d.maxAmount)),
    then: stakeRange(d.maxAmount),
  };
}

/** 동의 항목 (와이어프레임 + 실패금 공개 원칙, SPEC 3) */
export const CONSENT_ITEMS = [
  '약속을 어기면 등록한 카드로 자동 결제되는 것을 이해했어요',
  '결제 전 24시간 안에 이의를 제기할 수 있어요',
  '결제된 금액은 다른 사람에게 가지 않고 작심삼만원의 매출이 돼요',
  '이용약관과 자동결제에 동의해요',
];

export function ConfirmView({
  summary,
  card,
  blocked,
  onBack,
  onStart,
  onChangeCard,
  initialChecks,
}: {
  summary: ConfirmSummary;
  /** 등록된 카드. 없으면 12번(카드 등록하고 시작하기) */
  card?: { company: string; last4: string } | null;
  /** 결제 실패 72시간이 지나 새 약속을 만들 수 없음 */
  blocked?: boolean;
  onBack: () => void;
  /** 카드 없음 → PG 창, 카드 있음 → 바로 시작 */
  onStart: () => void;
  onChangeCard: () => void;
  /** 갤러리용 */
  initialChecks?: boolean[];
}) {
  const [checks, setChecks] = useState<boolean[]>(initialChecks ?? CONSENT_ITEMS.map(() => false));
  const all = checks.every(Boolean);
  const caption = blocked
    ? '결제가 안 된 금액이 있어서 새 약속을 만들 수 없어요. 카드를 바꿔주세요.'
    : card
      ? '지금은 결제되지 않아요. 어기면 등록된 카드로 결제돼요.'
      : '지금은 결제되지 않아요. 카드만 등록해요.';

  return (
    <Screen
      wide
      scroll
      gap={card ? 14 : 16}
      footer={
        <BottomActions caption={caption}>
          <Button
            label={card ? '이 약속 시작하기' : '카드 등록하고 시작하기'}
            disabled={!all || blocked}
            onPress={onStart}
          />
        </BottomActions>
      }
    >
      <Header onBack={onBack} step="3 / 3" />
      <Title>{'이 약속으로\n시작할게요'}</Title>
      <View style={{ borderTopWidth: 1, borderTopColor: colors.lineOnGround }}>
        <KeyValueRow onGround label="약속" value={summary.name} />
        <KeyValueRow onGround label="인증 시간" value={summary.schedule} />
        <KeyValueRow onGround label="인증 방식" value={summary.method} />
        <KeyValueRow onGround label="처음 어기면" value={summary.first} />
        <KeyValueRow onGround label="그다음부터" value={summary.then} />
        <KeyValueRow onGround label="결제되는 때" value="어긴 날로부터 24시간 뒤" />
        {card ? (
          <KeyValueRow
            onGround
            label="결제 카드"
            value={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: -6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="card" size={18} />
                  <Text size={15} weight="semibold">
                    {card.company} •••• {card.last4}
                  </Text>
                </View>
                <PillButton label="변경" onPress={onChangeCard} />
              </View>
            }
          />
        ) : null}
      </View>
      <View style={{ paddingVertical: 10, paddingHorizontal: 18, borderRadius: 16, backgroundColor: colors.surface }}>
        <CheckRow checked={all} onPress={() => setChecks(checks.map(() => !all))}>
          <Text size={14} weight="bold" style={{ lineHeight: 20 }}>
            모두 동의해요
          </Text>
        </CheckRow>
        <View style={{ height: 1, backgroundColor: colors.lineOnSurface, marginVertical: 6 }} />
        {CONSENT_ITEMS.map((t, i) => (
          <CheckRow
            key={t}
            checked={checks[i]}
            onPress={() => setChecks(checks.map((c, j) => (j === i ? !c : c)))}
          >
            <Text size={14} style={{ lineHeight: 20 }}>
              {t}
            </Text>
          </CheckRow>
        ))}
      </View>
    </Screen>
  );
}

export default function ConfirmRoute() {
  const now = useNow();
  const state = useStore();
  const { draft, card } = state;

  if (!draft) return <NoDraftView onBack={() => router.back()} onGoal={() => replace(href.goal)} />;

  return (
    <ConfirmView
      summary={summaryOf(draft)}
      card={card}
      blocked={isPaymentBlocked(state, now)}
      onBack={() => router.back()}
      onChangeCard={() => go(href.pg('change'))}
      onStart={() => {
        if (!card) return go(href.pg('create'));
        useStore.getState().createPromise();
        goHome();
      }}
    />
  );
}
