/** 50. 결제 내역: 계정에서. 실패금(PG)만 보이고 프로 구독료는 스토어에서 따로 결제된다 (SPEC 3) */
import { router } from 'expo-router';
import { Fragment } from 'react';
import { View } from 'react-native';

import { Caption, Card, DotText, Header, Screen, StatPair, Text } from '../components';
import { DAY, KIND_NAMES, dayLabel, num, whenLabel, won } from '../domain/rules';
import type { ChargeStatus } from '../domain/types';
import { useNow, useStore } from '../store';
import type { Data } from '../store';
import { isPro } from '../store/selectors';
import { colors, radius } from '../theme';
import { goHome } from '../lib/nav';

export type PaymentRow = {
  id: string;
  name: string;
  detail: string;
  amount: number;
  status: ChargeStatus;
};

export type PaymentsModel = {
  monthLabel: string;
  monthPaid: number;
  totalPaid: number;
  groups: { label: string; rows: PaymentRow[] }[];
  pro: boolean;
};

const STATUS_LABEL: Record<ChargeStatus, string> = {
  paid: '결제 완료',
  scheduled: '결제 예정',
  held: '보류',
  failed: '결제 실패',
  canceled: '취소',
};

export function buildPaymentsModel(d: Data, now: number): PaymentsModel {
  const today = new Date(now);
  const items = Object.values(d.charges)
    .map((c) => {
      const o = d.occurrences[c.occurrenceId];
      const p = d.promises[c.promiseId];
      const missedAt = o?.start ?? c.scheduledAt - DAY;
      return { c, missedAt, name: p ? KIND_NAMES[p.kind] : '약속' };
    })
    .sort((a, b) => b.missedAt - a.missedAt);

  const groups: PaymentsModel['groups'] = [];
  for (const { c, missedAt, name } of items) {
    const md = new Date(missedAt);
    const label =
      md.getFullYear() === today.getFullYear() ? `${md.getMonth() + 1}월` : `${md.getFullYear()}년 ${md.getMonth() + 1}월`;
    let g = groups[groups.length - 1];
    if (!g || g.label !== label) groups.push((g = { label, rows: [] }));
    const missed = `${dayLabel(missedAt)} 놓침`;
    let detail: string;
    if (c.status === 'paid') detail = c.amount === 0 ? `${missed}, 첫 연습` : `${missed}, ${dayLabel(c.paidAt ?? c.scheduledAt)} 결제`;
    else if (c.status === 'scheduled') detail = `${missed}, ${whenLabel(c.scheduledAt, now)} 결제 예정`;
    else if (c.status === 'held') detail = `${missed}, 검토 중이라 결제 보류`;
    else if (c.status === 'failed') detail = `${missed}, 카드 결제 실패`;
    else detail = `${missed}, 이의제기로 취소`;
    g.rows.push({ id: c.id, name, detail, amount: c.amount, status: c.status });
  }

  const paid = Object.values(d.charges).filter((c) => c.status === 'paid');
  const inMonth = (t: number) => {
    const x = new Date(t);
    return x.getFullYear() === today.getFullYear() && x.getMonth() === today.getMonth();
  };
  return {
    monthLabel: `${today.getMonth() + 1}월`,
    monthPaid: paid.filter((c) => inMonth(c.paidAt ?? c.scheduledAt)).reduce((a, c) => a + c.amount, 0),
    totalPaid: paid.reduce((a, c) => a + c.amount, 0),
    groups,
    pro: isPro(d),
  };
}

export function PaymentsView({ model, onBack }: { model: PaymentsModel; onBack: () => void }) {
  const m = model;
  return (
    <Screen
      scroll
      footer={
        <Caption>
          {m.pro
            ? '프로 구독료는 실패금과 따로 스토어에서 결제돼요. 구독 내역은 스토어에서 확인할 수 있어요.'
            : '구독료 결제는 스토어 구독 내역에서 확인할 수 있어요.'}
        </Caption>
      }
    >
      <Header onBack={onBack} title="결제 내역" />
      <StatPair
        left={{ label: `${m.monthLabel}에 낸 금액`, value: <Amount value={m.monthPaid} tone="signal" /> }}
        right={{ label: '지금까지 낸 금액', value: <Amount value={m.totalPaid} tone="ink" /> }}
      />

      {m.groups.length === 0 ? (
        <Card padding={24} style={{ alignItems: 'center', gap: 6 }}>
          <Text size={16} weight="semibold">
            아직 결제된 적이 없어요
          </Text>
          <Text size={13} color="text3">
            약속을 지키면 한 푼도 나가지 않아요
          </Text>
        </Card>
      ) : (
        m.groups.map((g) => (
          <Fragment key={g.label}>
            <Text size={13} weight="semibold" color="text2" style={{ paddingTop: 8, paddingHorizontal: 4 }}>
              {g.label}
            </Text>
            <View style={{ paddingVertical: 4, paddingHorizontal: 20, borderRadius: radius.card, backgroundColor: colors.surface }}>
              {g.rows.map((r, i) => (
                <Row key={r.id} row={r} last={i === g.rows.length - 1} />
              ))}
            </View>
          </Fragment>
        ))
      )}
    </Screen>
  );
}

function Amount({ value, tone }: { value: number; tone: 'signal' | 'ink' }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
      <DotText size={30} color={tone}>
        {num(value)}
      </DotText>
      <Text size={14} weight="semibold" color={tone === 'signal' ? 'textOnInk' : 'text3'}>
        원
      </Text>
    </View>
  );
}

function Row({ row, last }: { row: PaymentRow; last: boolean }) {
  const muted = row.status === 'canceled';
  return (
    <View
      style={[
        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 66, gap: 12, paddingVertical: 10 },
        !last && { borderBottomWidth: 1, borderBottomColor: colors.lineOnSurface },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text size={15} weight="semibold">
          {row.name}
        </Text>
        <Text size={12} color="text3">
          {row.detail}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text
          size={16}
          weight="bold"
          color={muted ? 'text3' : 'ink'}
          style={muted ? { textDecorationLine: 'line-through' } : undefined}
        >
          {won(row.amount)}
        </Text>
        <Text size={12} color={row.status === 'failed' ? 'signal' : 'text3'}>
          {STATUS_LABEL[row.status]}
        </Text>
      </View>
    </View>
  );
}

/** 바로 들어온 경우(알림·개발용 주소) 뒤로 갈 곳이 없으면 홈으로 */
const back = () => (router.canGoBack() ? router.back() : goHome());

export default function PaymentsRoute() {
  const now = useNow(60_000);
  const d = useStore();
  return <PaymentsView model={buildPaymentsModel(d, now)} onBack={back} />;
}
