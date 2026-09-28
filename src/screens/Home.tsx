/** 15~18. 홈: 대기 / 인증 창 열림 / 약속 없음 / 여러 약속 열림 */
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import {
  Button,
  BottomActions,
  Card,
  ClockCard,
  DotText,
  Icon,
  IconButton,
  ListCard,
  ListRow,
  PillButton,
  RowStatus,
  Screen,
  Text,
  type LedState,
} from '../components';
import { clock, durationLabel, hms, isNarrow, shortRemain, whenLabel, won } from '../domain/rules';
import { eventHref, href, verifyHref } from '../lib/routes';
import { useNow, useStore } from '../store';
import {
  activePromises,
  homeFeature,
  pendingEvent,
  promiseSubtitle,
  promiseTitle,
  rowState,
  stakeOf,
  totalKeptDays,
  type RowState,
} from '../store/selectors';

export type HomeRow = {
  id: string;
  title: string;
  subtitle: string;
  led: LedState;
  state: RowState;
  /** 인증 버튼·확인 중 버튼이 갈 곳 */
  actionHref?: string;
};

export type HomeModel =
  | { variant: 'empty'; keptDays: number }
  | {
      variant: 'waiting' | 'open' | 'multi';
      card: {
        tone: 'ink' | 'signal';
        name: string;
        digits: string;
        metaLeft: string;
        metaRight: string;
        promiseId: string;
      };
      rows: HomeRow[];
      caption: string;
      cta: { label: string; href?: string };
      now: number;
    };

/** 스토어 → 홈 화면 모델 */
export function buildHomeModel(d: ReturnType<typeof useStore.getState>, now: number): HomeModel {
  const ps = activePromises(d);
  if (ps.length === 0) return { variant: 'empty', keptDays: totalKeptDays(d) };
  const { feature, openCount } = homeFeature(d, now);
  const rows: HomeRow[] = ps.map((p) => {
    const { state, occ } = rowState(d, p, now);
    const led: LedState =
      state.kind === 'verify' || state.kind === 'checking' || state.kind === 'rejected'
        ? 'glow'
        : state.kind === 'kept'
          ? 'ink'
          : state.kind === 'waiting'
            ? 'on'
            : 'off';
    return {
      id: p.id,
      title: promiseTitle(p),
      subtitle: promiseSubtitle(p),
      led,
      state,
      actionHref: occ ? verifyHref(p, occ) : undefined,
    };
  });

  if (!feature) {
    return {
      variant: 'waiting',
      card: { tone: 'ink', name: '', digits: '--:--:--', metaLeft: '예정된 인증이 없어요', metaRight: '', promiseId: ps[0].id },
      rows,
      caption: '약속 상세에서 인증 시간을 확인해 보세요',
      cta: { label: '인증하기' },
      now,
    };
  }

  const { promise: p, occ: o, mode } = feature;
  const name = promiseTitle(p);
  const stake = `${won(stakeOf(p))} 걸림`;
  const verify = verifyHref(p, o);
  const auto = p.method !== 'photo';
  const ctaLabel = auto ? `${name} 기록 확인하기` : openCount >= 2 ? `${name} 인증하기` : '지금 인증하기';

  if (mode === 'next') {
    const len = o.end - o.start;
    return {
      variant: 'waiting',
      card: {
        tone: 'ink',
        name,
        digits: hms(o.start - now),
        metaLeft: `${whenLabel(o.start, now)}–${clock(o.end)} 인증`,
        metaRight: stake,
        promiseId: p.id,
      },
      rows,
      caption: isNarrow(o.start, o.end)
        ? `${name} 인증은 ${clock(o.start)}부터 ${durationLabel(len)} 동안 열려요`
        : `${name} 인증은 ${clock(o.start)}부터 ${clock(o.end)}까지 열려요`,
      cta: { label: '인증하기' },
      now,
    };
  }

  const narrow = mode === 'open';
  return {
    variant: openCount >= 2 ? 'multi' : 'open',
    card: {
      tone: narrow ? 'signal' : 'ink',
      name,
      digits: hms(o.end - now),
      metaLeft: narrow ? `${clock(o.end)}에 닫혀요` : `오늘 ${clock(o.end)} 마감`,
      metaRight: stake,
      promiseId: p.id,
    },
    rows,
    caption:
      openCount >= 2
        ? `${name}${josa(name)} ${clock(o.end)}까지 인증하지 않으면 ${won(stakeOf(p))}이 결제돼요`
        : `${clock(o.end)}까지 인증하지 않으면 ${won(stakeOf(p))}이 결제돼요`,
    cta: { label: ctaLabel, href: verify },
    now,
  };
}

/** 은/는 */
const josa = (w: string) => {
  const c = w.charCodeAt(w.length - 1) - 0xac00;
  return c >= 0 && c % 28 > 0 ? '은' : '는';
};

export function HomeView({
  model,
  onNavigate,
}: {
  model: HomeModel;
  onNavigate: (to: string) => void;
}) {
  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 4 }}>
      <Text size={22} weight="bold" tight>
        오늘의 약속
      </Text>
      <IconButton label="계정" round onPress={() => onNavigate(href.account)}>
        <Icon name="user" size={20} />
      </IconButton>
    </View>
  );

  if (model.variant === 'empty') {
    return (
      <Screen
        footer={
          <BottomActions caption="내일 아침부터 다시 시작해 볼까요?">
            <Button label="새 약속 만들기" onPress={() => onNavigate(href.goal)} />
          </BottomActions>
        }
      >
        {header}
        <ClockCard variant="home" label="알람 없음" digits="--:--:--" digitsColor="inkRaised" led="dim" name=" ">
          <Text size={16} weight="semibold" color="surface">
            지금은 지킬 약속이 없어요
          </Text>
        </ClockCard>
        <ListHeader count={0} onAdd={() => onNavigate(href.goal)} />
        <Card padding={24} style={{ alignItems: 'center', gap: 6 }}>
          <Text size={16} weight="semibold">
            아직 약속이 없어요
          </Text>
          <Text size={13} color="text3">
            지금까지 지킨 날 {model.keptDays}일
          </Text>
        </Card>
      </Screen>
    );
  }

  const { card, rows, caption, cta, now } = model;
  return (
    <Screen
      footer={
        <BottomActions caption={caption}>
          <Button label={cta.label} disabled={!cta.href} onPress={() => cta.href && onNavigate(cta.href)} />
        </BottomActions>
      }
    >
      {header}
      <ClockCard
        variant="home"
        tone={card.tone}
        label="남은 시간"
        name={card.name}
        digits={card.digits}
        metaLeft={card.metaLeft}
        metaRight={card.metaRight}
        onPress={() => onNavigate(href.promise(card.promiseId))}
      />
      <ListHeader count={rows.length} onAdd={() => onNavigate(href.goal)} />
      <ScrollView style={{ flexGrow: 0, flexShrink: 1 }} showsVerticalScrollIndicator={false}>
        <ListCard>
          {rows.map((r, i) => (
            <ListRow
              key={r.id}
              led={r.led}
              title={r.title}
              subtitle={r.subtitle}
              last={i === rows.length - 1}
              onPress={() => onNavigate(href.promise(r.id))}
              right={<RowRight row={r} multi={model.variant === 'multi'} now={now} onNavigate={onNavigate} />}
            />
          ))}
        </ListCard>
      </ScrollView>
    </Screen>
  );
}

function ListHeader({ count, onAdd }: { count: number; onAdd: () => void }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, paddingHorizontal: 4 }}>
      <Text size={15} weight="bold">
        모든 약속{' '}
        <Text size={15} weight="medium" color="text2">
          {count}
        </Text>
      </Text>
      <Pressable accessibilityRole="button" onPress={onAdd} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, height: 44 }}>
        <Icon name="plus" size={16} strokeWidth={2.5} />
        <Text size={14} weight="semibold">
          추가
        </Text>
      </Pressable>
    </View>
  );
}

function RowRight({
  row,
  multi,
  now,
  onNavigate,
}: {
  row: HomeRow;
  multi: boolean;
  now: number;
  onNavigate: (to: string) => void;
}) {
  const s = row.state;
  const go = () => row.actionHref && onNavigate(row.actionHref);
  switch (s.kind) {
    case 'verify':
      return multi ? <PillButton label="인증" onPress={go} /> : <Pressable onPress={go}><RowStatus top="지금 인증" /></Pressable>;
    case 'rejected':
      return <PillButton label="다시 찍기" onPress={go} />;
    case 'checking':
      return <PillButton label="확인 중" onPress={go} />;
    case 'judging':
      return <RowStatus top="판정 중" muted />;
    case 'reviewing':
      return <RowStatus top="판정 확인 중" bottom="6시간 안에" muted />;
    case 'kept':
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Icon name="check" size={16} strokeWidth={2.5} />
          <Text size={14} weight="semibold">
            오늘 지킴
          </Text>
        </View>
      );
    case 'missed':
      return <RowStatus top="놓침" bottom="이의제기 가능" muted />;
    case 'paused':
      return <RowStatus top="쉬는 날" bottom={s.next} muted />;
    case 'waiting': {
      const left = s.at - now;
      if (left > 0 && left < 24 * 3600_000)
        return (
          <RowStatus
            top={
              <DotText size={22} style={{ lineHeight: 24 }}>
                {shortRemain(left)}
              </DotText>
            }
            bottom="남음"
          />
        );
      return <RowStatus top={s.label} muted />;
    }
  }
}

export default function HomeRoute() {
  const now = useNow();
  const state = useStore();
  const model = buildHomeModel(state, now);

  // 알림으로 진입해야 할 화면이 있으면 먼저 보여준다 (놓친 날, 결제 실패 등)
  useFocusEffect(
    useCallback(() => {
      const s = useStore.getState();
      const e = pendingEvent(s);
      if (!e) return;
      const to = eventHref(e, s);
      s.markSeen(e.id);
      if (to) router.push(to as never);
    }, [state.events.length]),
  );

  return <HomeView model={model} onNavigate={(to) => router.push(to as never)} />;
}
