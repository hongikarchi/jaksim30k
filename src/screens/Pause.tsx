/** 41. 쉬어가기 예약: 앞으로 있을 약속 날 중 쉴 날을 고른다 (SPEC 2.5) */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import {
  BottomActions,
  Button,
  Calendar,
  DotText,
  Header,
  Screen,
  Spacer,
  Text,
  type DayMark,
} from '../components';
import { dateKey, monthKey, parseDateKey, pauseLimit } from '../domain/rules';
import { colors } from '../theme';
import type { Data } from '../store';
import { useNow, useStore } from '../store';
import { isPro, occurrencesOf } from '../store/selectors';

/** 고를 수 있는 날 하나 */
export type PauseDay = { occurrenceId: string; date: string };

export type PauseModel = {
  /** 이번 달 기준 'YYYY-MM' */
  thisMonth: string;
  limit: number;
  /** 달마다 이미 쓴 쉬어가기 횟수 */
  used: Record<string, number>;
  /** 고를 수 있는 날 (오늘부터, 창이 닫히기 전, 대기·열림 상태) */
  days: PauseDay[];
  /** 이미 쉬기로 한 날 (YYYY-MM-DD) */
  paused: string[];
  /** 처음 보여줄 달 */
  start: { year: number; month: number };
};

export function buildPauseModel(d: Data, id: string, now: number): PauseModel | null {
  const p = d.promises[id];
  if (!p) return null;
  const pro = isPro(d);
  const list = occurrencesOf(d, id);
  const days = list
    .filter((o) => o.end > now && (o.status === 'upcoming' || o.status === 'open'))
    .map((o) => ({ occurrenceId: o.id, date: o.date }));
  const today = dateKey(new Date(now));
  const paused = list.filter((o) => o.status === 'paused' && o.date >= today).map((o) => o.date);
  const first = parseDateKey(days[0]?.date ?? today);
  return {
    thisMonth: monthKey(new Date(now)),
    limit: pauseLimit(pro),
    used: p.pausesByMonth,
    days,
    paused,
    start: { year: first.getFullYear(), month: first.getMonth() + 1 },
  };
}

const mk = (y: number, m: number) => `${y}-${String(m).padStart(2, '0')}`;

export function PauseView({
  model,
  initialPicked = [],
  error,
  onBack,
  onSubmit,
}: {
  model: PauseModel;
  initialPicked?: string[];
  /** 예약이 거절됐을 때 이유 */
  error?: string;
  onBack: () => void;
  /** 고른 창 id들 */
  onSubmit: (occurrenceIds: string[]) => void;
}) {
  const [view, setView] = useState(model.start);
  const [picked, setPicked] = useState<string[]>(initialPicked);

  const monthOfView = mk(view.year, view.month);
  const left = (month: string) =>
    Math.max(0, model.limit - (model.used[month] ?? 0) - picked.filter((d) => d.startsWith(month)).length);

  const inView = (date: string) => date.startsWith(monthOfView + '-');
  const dayNum = (date: string) => Number(date.slice(8, 10));
  const byDay = new Map(model.days.filter((x) => inView(x.date)).map((x) => [dayNum(x.date), x]));

  const marks: Record<number, DayMark> = {};
  const count = new Date(view.year, view.month, 0).getDate();
  for (let i = 1; i <= count; i++) marks[i] = byDay.has(i) ? 'upcoming' : 'rest';

  const selected = [...picked, ...model.paused].filter(inView).map(dayNum);

  const toggle = (day: number) => {
    const x = byDay.get(day);
    if (!x) return;
    if (picked.includes(x.date)) setPicked(picked.filter((d) => d !== x.date));
    else if (left(monthOfView) > 0) setPicked([...picked, x.date]);
  };

  // 앞뒤 달에 고를 수 있는 날이 있을 때만 넘길 수 있다
  const months = [...new Set(model.days.map((x) => x.date.slice(0, 7)))];
  const hasPrev = months.some((x) => x < monthOfView);
  const hasNext = months.some((x) => x > monthOfView);
  const shift = (dir: 1 | -1) => {
    const i = view.year * 12 + view.month - 1 + dir;
    setView({ year: Math.floor(i / 12), month: (i % 12) + 1 });
  };

  const label = picked.length ? `${pickedLabel(picked)} 쉬어가기` : '날짜를 골라주세요';
  const leftLabel = monthOfView === model.thisMonth ? '이번 달 남은 횟수' : `${view.month}월 남은 횟수`;

  return (
    <Screen
      gap={12}
      scroll
      footer={
        <BottomActions caption={error}>
          <Button
            label={label}
            disabled={!picked.length}
            onPress={() => onSubmit(model.days.filter((x) => picked.includes(x.date)).map((x) => x.occurrenceId))}
          />
        </BottomActions>
      }
    >
      <Header onBack={onBack} title="쉬어가기" />
      <View style={{ gap: 6, paddingHorizontal: 4 }}>
        <Text size={22} weight="bold" tight>
          쉬고 싶은 날을 골라주세요
        </Text>
        <Text size={14} color="text2" body>
          고른 날은 인증하지 않아도 결제되지 않고, 연속 기록도 이어져요.
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 16,
          paddingHorizontal: 20,
          borderRadius: 20,
          backgroundColor: colors.ink,
        }}
      >
        <Text size={13} color="textOnInk">
          {leftLabel}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
          <DotText size={30} color="signal">
            {left(monthOfView)}
          </DotText>
          <Text size={16} weight="bold" color="surface">
            회
          </Text>
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <Calendar
          year={view.year}
          month={view.month}
          marks={marks}
          selected={selected}
          onPressDay={toggle}
          selectable={(day) => byDay.has(day)}
          onPrev={hasPrev ? () => shift(-1) : undefined}
          onNext={hasNext ? () => shift(1) : undefined}
        />
        <View style={{ flexDirection: 'row', gap: 14, paddingHorizontal: 4 }}>
          <Legend color={colors.signal} label="쉬는 날" />
          <Legend color={colors.surface} border label="고를 수 있는 날" />
          <Legend color={colors.fill} label="고를 수 없는 날" />
        </View>
      </View>
      <Text size={13} color="text2" body style={{ paddingHorizontal: 4 }}>
        오늘도 고를 수 있어요. 단, 인증 창이 닫히기 전까지만 돼요.
      </Text>
      <Spacer />
    </Screen>
  );
}

function Legend({ color, label, border }: { color: string; label: string; border?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 3,
          backgroundColor: color,
          borderWidth: border ? 1 : 0,
          borderColor: colors.border,
        }}
      />
      <Text size={12} color="text3">
        {label}
      </Text>
    </View>
  );
}

/** "10월 5, 6일" / "9월 30일, 10월 1일" */
function pickedLabel(dates: string[]) {
  const groups = new Map<number, number[]>();
  for (const d of [...dates].sort()) {
    const m = Number(d.slice(5, 7));
    groups.set(m, [...(groups.get(m) ?? []), Number(d.slice(8, 10))]);
  }
  return [...groups].map(([m, ds]) => `${m}월 ${ds.join(', ')}일`).join(', ');
}

export default function PauseRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const now = useNow();
  const state = useStore();
  const [error, setError] = useState<string>();
  const model = buildPauseModel(state, id, now);
  if (!model) return null;
  return (
    <PauseView
      model={model}
      error={error}
      onBack={() => router.back()}
      onSubmit={(ids) => {
        const r = state.pauseDays(id, ids);
        if (r.ok) router.back();
        else setError(r.reason);
      }}
    />
  );
}
