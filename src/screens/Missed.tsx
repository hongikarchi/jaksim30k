/** 32. 놓친 날 (+ 33·34 러닝·헬스장 인증 실패가 같은 틀을 쓴다) */
import { useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { BottomActions, Button, ClockCard, KeyValueRow, Screen, Text } from '../components';
import { clockSec, hms, whenLabel, won, stageAmount } from '../domain/rules';
import type { Data } from '../store';
import { href } from '../lib/routes';
import { go, goHome } from '../lib/nav';
import { useNow, useStore } from '../store';
import { cardLabel, promiseTitle } from '../store/selectors';
import { colors } from '../theme';
import { NotFound, WhiteRows, dayWord, paramOf, type OutcomeCharge, type OutcomeDispute } from './outcomeParts';

/** 놓친 날 화면들이 공통으로 받는 값 */
export type MissedInfo = {
  /** 약속 이름 (미라클모닝) */
  name: string;
  /** 창 시작 시각 (어느 날의 약속인지) */
  date: number;
  charge?: OutcomeCharge;
  dispute?: OutcomeDispute;
  /** 신한카드 •••• 4821 */
  card: string;
  /** 다음에 어기면 낼 금액 */
  nextAmount: number;
};

export type MissedActions = {
  onDispute: () => void;
  /** 이미 낸 이의제기 보기 */
  onDisputeStatus: () => void;
  onPaymentFailed: () => void;
  onHome: () => void;
};

/** 스토어 → 놓친 날 공통 값 */
export function buildMissedInfo(d: Data, occId: string): MissedInfo | null {
  const o = d.occurrences[occId];
  const p = o && d.promises[o.promiseId];
  if (!o || !p) return null;
  const c = o.chargeId ? d.charges[o.chargeId] : undefined;
  const dp = o.disputeId ? d.disputes[o.disputeId] : undefined;
  return {
    name: promiseTitle(p),
    date: o.start,
    charge: c && { amount: c.amount, scheduledAt: c.scheduledAt, status: c.status, paidAt: c.paidAt },
    dispute: dp && { id: dp.id, status: dp.status, dueAt: dp.dueAt },
    card: cardLabel(d),
    nextAmount: stageAmount(p.missCount, p.maxAmount),
  };
}

/** 이의제기·결제 상태에 따라 시계 카드와 보조 버튼이 바뀐다 */
function stateOf(info: MissedInfo, now: number, title: string, subtitle: string) {
  const c = info.charge;
  const dp = info.dispute;
  const until = (t: number) => hms(t - now);
  if (dp?.status === 'reviewing')
    return {
      label: '답변 예정까지',
      digits: until(dp.dueAt),
      digitsColor: 'surface' as const,
      title: '이의제기를 확인하고 있어요',
      subtitle: '결과가 나올 때까지 결제는 멈춰 있어요',
      secondary: { label: '이의제기 진행 보기', kind: 'status' as const },
    };
  if (dp?.status === 'approved' || c?.status === 'canceled')
    return {
      label: '결제 취소',
      digits: '--:--:--',
      digitsColor: 'inkRaised' as const,
      title: '이의제기가 받아들여졌어요',
      subtitle: '결제를 취소하고 지킨 날로 기록했어요',
      secondary: dp ? { label: '이의제기 결과 보기', kind: 'status' as const } : undefined,
    };
  if (c?.status === 'paid')
    return {
      label: '결제한 시각',
      digits: c.paidAt ? clockSec(c.paidAt) : '--:--:--',
      digitsColor: 'surface' as const,
      title,
      subtitle: c.paidAt ? `${whenLabel(c.paidAt, now)}에 ${won(c.amount)}이 결제됐어요` : '결제가 끝났어요',
      secondary: dp ? { label: '이의제기 결과 보기', kind: 'status' as const } : undefined,
    };
  if (c?.status === 'failed')
    return {
      label: '결제 실패',
      digits: '--:--:--',
      digitsColor: 'inkRaised' as const,
      title,
      subtitle: '카드를 바꾸면 바로 다시 결제해요',
      secondary: { label: '카드 바꾸기', kind: 'payment' as const },
    };
  if (dp?.status === 'denied')
    return {
      label: '결제까지',
      digits: c ? until(c.scheduledAt) : '--:--:--',
      digitsColor: undefined,
      title: '이의제기가 받아들여지지 않았어요',
      subtitle: '결제 예정 시각에 등록한 카드로 결제돼요',
      secondary: { label: '이의제기 결과 보기', kind: 'status' as const },
    };
  return {
    label: '이의제기 마감까지',
    digits: c ? until(c.scheduledAt) : '--:--:--',
    digitsColor: undefined,
    title,
    subtitle: c && c.amount === 0 ? '첫 번째는 연습이라 결제되지 않아요' : subtitle,
    secondary: { label: '억울해요, 이의제기할래요', kind: 'dispute' as const },
  };
}

/** 결제 예정 줄: 상태에 따라 라벨과 값이 바뀐다 */
export function chargeWhenRow(info: MissedInfo, now: number, last?: boolean) {
  const c = info.charge;
  if (!c) return <KeyValueRow label="결제 예정" value="없음" last={last} />;
  if (c.status === 'paid')
    return <KeyValueRow label="결제한 때" value={c.paidAt ? whenLabel(c.paidAt, now) : '결제 완료'} last={last} />;
  if (c.status === 'canceled') return <KeyValueRow label="결제" value="취소됨" last={last} />;
  if (c.status === 'failed') return <KeyValueRow label="결제" value="실패, 카드 확인 필요" last={last} />;
  if (c.status === 'held') return <KeyValueRow label="결제" value="이의제기 확인 중 멈춤" last={last} />;
  return <KeyValueRow label="결제 예정" value={whenLabel(c.scheduledAt, now)} last={last} />;
}

/** 놓친 날·인증 실패 화면 공통 틀 */
export function MissedLayout({
  info,
  now,
  title,
  subtitle,
  rows,
  actions,
}: {
  info: MissedInfo;
  now: number;
  /** 기본 제목 (오늘 약속을 놓쳤어요 / 러닝 거리가 모자랐어요) */
  title: string;
  subtitle: string;
  /** 금액 아래 줄들 */
  rows: ReactNode;
  actions: MissedActions;
}) {
  const s = stateOf(info, now, title, subtitle);
  const c = info.charge;
  const canceled = c?.status === 'canceled';
  const amountLabel = canceled ? '취소된 금액' : c?.status === 'paid' ? '결제된 금액' : '결제될 금액';
  const approved = info.dispute?.status === 'approved' || canceled;
  const onSecondary =
    s.secondary?.kind === 'dispute'
      ? actions.onDispute
      : s.secondary?.kind === 'payment'
        ? actions.onPaymentFailed
        : actions.onDisputeStatus;

  return (
    <Screen
      topGap="wide"
      gap={18}
      scroll
      footer={
        <BottomActions>
          {s.secondary ? <Button variant="secondary" label={s.secondary.label} onPress={onSecondary} /> : null}
          <Button label={approved ? '확인' : '확인했어요, 내일은 지킬게요'} onPress={actions.onHome} />
        </BottomActions>
      }
    >
      <ClockCard
        label={s.label}
        name={info.name}
        led={approved ? 'white' : 'on'}
        digits={s.digits}
        digitsColor={s.digitsColor}
        title={s.title}
        subtitle={s.subtitle}
      />
      <AmountCard label={amountLabel} amount={c?.amount ?? 0} strike={canceled} rows={rows} />
    </Screen>
  );
}

function AmountCard({ label, amount, strike, rows }: { label: string; amount: number; strike?: boolean; rows: ReactNode }) {
  return (
    <WhiteRows padY={8}>
      <View style={{ gap: 4, paddingVertical: 16 }}>
        <Text size={13} color="text3">
          {label}
        </Text>
        <Text
          size={34}
          weight="bold"
          tight="more"
          color={strike ? 'text3' : 'ink'}
          style={strike ? { textDecorationLine: 'line-through' } : undefined}
        >
          {won(amount)}
        </Text>
        {amount === 0 && !strike ? (
          <Text size={13} color="text2">
            첫 번째 놓친 날은 연습이라 0원이에요
          </Text>
        ) : null}
      </View>
      <Divider />
      {rows}
    </WhiteRows>
  );
}

const Divider = () => <View style={{ height: 1, backgroundColor: colors.lineOnSurface }} />;

export function MissedView({ info, now, ...actions }: { info: MissedInfo; now: number } & MissedActions) {
  return (
    <MissedLayout
      info={info}
      now={now}
      title={`${dayWord(info.date, now)} 약속을 놓쳤어요`}
      subtitle="마감이 지나면 등록한 카드로 결제돼요"
      actions={actions}
      rows={
        <>
          {chargeWhenRow(info, now)}
          <KeyValueRow label="결제 수단" value={info.card} />
          <KeyValueRow label="다음에 어기면" value={won(info.nextAmount)} last />
        </>
      }
    />
  );
}

/** 이동 콜백 묶음 (놓친 날·인증 실패 공통) */
export function missedActions(occId: string, info: MissedInfo | null): MissedActions {
  return {
    onDispute: () => go(href.dispute(occId)),
    onDisputeStatus: () => {
      const dp = info?.dispute;
      if (!dp) return;
      go(dp.status === 'reviewing' ? href.disputeSubmitted(dp.id) : href.disputeResult(dp.id));
    },
    onPaymentFailed: () => go(href.paymentFailed),
    onHome: goHome,
  };
}

export default function MissedRoute() {
  const occ = paramOf(useLocalSearchParams<{ occ: string }>().occ);
  const now = useNow();
  const d = useStore();
  const info = buildMissedInfo(d, occ);
  if (!info) return <NotFound onHome={goHome} />;
  return <MissedView info={info} now={now} {...missedActions(occ, info)} />;
}
