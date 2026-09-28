/** 40. 약속 상세: 이번 달 기록 + 달력 + 약속 설정 (인증 시간·금액 단계는 시트) */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import {
  AmountStepper,
  BottomSheet,
  Button,
  Calendar,
  DayPicker,
  DotText,
  Header,
  InfoCard,
  ListCard,
  PillButton,
  Screen,
  SettingRow,
  StakeBars,
  StatPair,
  Text,
  TimeBar,
  TimeSheet,
  type DayMark,
} from '../components';
import {
  dateKey,
  dayLabel,
  firstWindow,
  fmtHM,
  num,
  pauseLimit,
  scheduleSummary,
  weekdayIndex,
  won,
} from '../domain/rules';
import type { HM, PromiseT, Schedule } from '../domain/types';
import { href } from '../lib/routes';
import { go } from '../lib/nav';
import type { Data } from '../store';
import { useNow, useStore } from '../store';
import { streakOf } from '../store/engine';
import { isPro, monthStats, occurrencesOf, promiseTitle } from '../store/selectors';
import { ProLockSheet } from './ProLockSheet';

export type DetailSheet = 'time' | 'stake';

export type PromiseDetailModel = {
  id: string;
  name: string;
  ended: boolean;
  endedAt?: number;
  /** 이번 달 기록 */
  kept: number;
  total: number;
  paid: number;
  streak: number;
  schedule: Schedule;
  maxAmount: number;
  /** 금액 단계 막대에서 강조할 단계 (0~3) */
  stage: number;
  watcher: { status: 'none' | 'invited' | 'connected'; name?: string };
  pro: boolean;
  pauseLimit: number;
  calendar: { year: number; month: number; marks: Record<number, DayMark>; canPrev: boolean; canNext: boolean };
};

const ym = (t: number) => {
  const d = new Date(t);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
};
const ymIndex = (v: { year: number; month: number }) => v.year * 12 + (v.month - 1);

/** 달력 칸 상태: 지킴·면제 = kept, 놓침 = missed, 쉼·약속 없는 날 = rest, 오늘, 앞으로 있을 약속 = upcoming */
export function calendarMarks(d: Data, p: PromiseT, year: number, month: number, now: number) {
  const byDate = new Map(occurrencesOf(d, p.id).map((o) => [o.date, o]));
  const today = dateKey(new Date(now));
  const created = dateKey(new Date(p.createdAt));
  const ended = p.endedAt ? dateKey(new Date(p.endedAt)) : undefined;
  const days = new Date(year, month, 0).getDate();
  const marks: Record<number, DayMark> = {};
  for (let day = 1; day <= days; day++) {
    const date = new Date(year, month - 1, day);
    const key = dateKey(date);
    const o = byDate.get(key);
    let mark: DayMark = 'none';
    if (o) {
      if (o.status === 'kept' || o.status === 'excused') mark = 'kept';
      else if (o.status === 'missed') mark = 'missed';
      else if (o.status === 'paused') mark = 'rest';
      else if (key === today) mark = 'today';
      else if (key > today) mark = 'upcoming';
    } else if (key < created || (ended && key > ended)) {
      mark = key === today ? 'today' : 'none';
    } else if (key === today) mark = 'today';
    else if (!p.schedule[weekdayIndex(date)]) mark = 'rest';
    else if (key > today) mark = 'upcoming';
    marks[day] = mark;
  }
  return marks;
}

/** 스토어 → 약속 상세 모델. view = 달력에 보여줄 달 (없으면 이번 달) */
export function buildPromiseDetailModel(
  d: Data,
  id: string,
  now: number,
  view?: { year: number; month: number },
): PromiseDetailModel | null {
  const p = d.promises[id];
  if (!p) return null;
  const cur = ym(now);
  const v = view ?? cur;
  const stats = monthStats(d, id, cur.year, cur.month, now);
  const w = p.watcher;
  const pro = isPro(d);
  // 달력은 약속을 만든 달부터 다음 달까지
  const min = ymIndex(ym(p.createdAt));
  const max = ymIndex(cur) + 1;
  return {
    id,
    name: promiseTitle(p),
    ended: p.status === 'ended',
    endedAt: p.endedAt,
    kept: stats.kept,
    total: stats.total,
    paid: stats.paid,
    streak: streakOf(d, id, now),
    schedule: p.schedule,
    maxAmount: p.maxAmount,
    stage: Math.min(p.missCount, 3),
    watcher: w ? { status: w.status, name: w.name } : { status: 'none' },
    pro,
    pauseLimit: pauseLimit(pro),
    calendar: {
      year: v.year,
      month: v.month,
      marks: calendarMarks(d, p, v.year, v.month, now),
      canPrev: ymIndex(v) > min,
      canNext: ymIndex(v) < max,
    },
  };
}

type ViewProps = {
  model: PromiseDetailModel;
  /** 도착하자마자 열 시트 (약속 끝내기의 대안에서) */
  initialSheet?: DetailSheet;
  onBack: () => void;
  onNavigate: (to: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSaveSchedule: (s: Schedule) => void;
  onSaveMax: (max: number) => void;
};

export function PromiseDetailView({
  model: m,
  initialSheet,
  onBack,
  onNavigate,
  onPrevMonth,
  onNextMonth,
  onSaveSchedule,
  onSaveMax,
}: ViewProps) {
  const [sheet, setSheet] = useState<DetailSheet | null>(m.ended ? null : (initialSheet ?? null));
  const [lock, setLock] = useState(false);
  useEffect(() => {
    if (initialSheet && !m.ended) setSheet(initialSheet);
  }, [initialSheet, m.ended]);

  const openWatcher = () => {
    if (!m.pro) return setLock(true);
    if (m.watcher.status === 'none') onNavigate(href.watcher(m.id));
    else if (m.watcher.status === 'invited') onNavigate(href.watcherMessage(m.id));
    else onNavigate(href.watcherConnected(m.id));
  };

  const watcherValue =
    m.watcher.status === 'none' ? '없음' : m.watcher.status === 'invited' ? `${m.watcher.name}, 수락 대기` : m.watcher.name;

  return (
    <Screen
      scroll
      gap={10}
      overlay={
        m.ended ? null : (
          <>
            <TimeScheduleSheet
              visible={sheet === 'time'}
              schedule={m.schedule}
              onClose={() => setSheet(null)}
              onSave={(s) => {
                onSaveSchedule(s);
                setSheet(null);
              }}
            />
            <StakeSheet
              visible={sheet === 'stake'}
              max={m.maxAmount}
              stage={m.stage}
              onClose={() => setSheet(null)}
              onSave={(v) => {
                onSaveMax(v);
                setSheet(null);
              }}
            />
            <ProLockSheet
              visible={lock}
              onClose={() => setLock(false)}
              title="감시자 지정은 프로에서 쓸 수 있어요"
              onStart={() => {
                setLock(false);
                onNavigate(href.pro);
              }}
            />
          </>
        )
      }
    >
      <Header onBack={onBack} title={m.name} />
      <StatPair
        left={{
          label: '이번 달 지킨 날',
          value: (
            <DotText size={30} color="signal">
              {m.kept}/{m.total}
            </DotText>
          ),
        }}
        right={{
          label: '이번 달 낸 금액',
          value: (
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
              <DotText size={30}>{num(m.paid)}</DotText>
              <Text size={16} weight="bold">
                원
              </Text>
            </View>
          ),
        }}
      />
      <Calendar
        year={m.calendar.year}
        month={m.calendar.month}
        marks={m.calendar.marks}
        onPrev={m.calendar.canPrev ? onPrevMonth : undefined}
        onNext={m.calendar.canNext ? onNextMonth : undefined}
      />
      {m.ended ? (
        <InfoCard icon="info" muted>
          {m.endedAt ? `${dayLabel(m.endedAt)}에 끝낸 약속이에요. ` : '끝낸 약속이에요. '}이 약속으로는 더 이상 결제되지 않아요.
        </InfoCard>
      ) : (
        <ListCard title="약속 설정">
          <SettingRow label="인증 시간" value={scheduleSummary(m.schedule)} onPress={() => setSheet('time')} />
          <SettingRow label="금액 단계" value={`최대 ${won(m.maxAmount)}`} onPress={() => setSheet('stake')} />
          <SettingRow label="감시자" pro value={watcherValue} onPress={openWatcher} />
          <SettingRow
            label="쉬어가기"
            description={`한 달에 ${m.pauseLimit}번, 쉬어도 기록이 이어져요`}
            action={<PillButton label="예약" onPress={() => onNavigate(href.pause(m.id))} />}
          />
          <SettingRow
            label="이 약속 끝내기"
            description="누르면 바로 끝나요"
            action={<PillButton label="끝내기" onPress={() => onNavigate(href.endPromise(m.id))} />}
            last
          />
        </ListCard>
      )}
    </Screen>
  );
}

/** 인증 시간 시트: 시간 바 + 요일 + 시·분 시트 */
function TimeScheduleSheet({
  visible,
  schedule,
  onClose,
  onSave,
}: {
  visible: boolean;
  schedule: Schedule;
  onClose: () => void;
  onSave: (s: Schedule) => void;
}) {
  const init = () => {
    const w = firstWindow(schedule) ?? { start: { h: 6, m: 0 }, end: { h: 6, m: 10 } };
    return { start: w.start, end: w.end, days: schedule.map((x) => !!x) };
  };
  const [v, setV] = useState(init);
  const [edit, setEdit] = useState<'start' | 'end' | null>(null);
  useEffect(() => {
    if (visible) setV(init());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const mins = (t: HM) => t.h * 60 + t.m;
  const valid = v.days.some(Boolean) && mins(v.end) > mins(v.start);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="인증 시간"
      ground
      footer={
        <>
          {!valid ? (
            <Text size={13} color="text2" align="center">
              {v.days.some(Boolean) ? '끝 시간은 시작 시간보다 늦어야 해요' : '요일을 하나 이상 골라주세요'}
            </Text>
          ) : null}
          <Button
            label="저장"
            disabled={!valid}
            onPress={() => onSave(v.days.map((on) => (on ? { start: v.start, end: v.end } : null)))}
          />
        </>
      }
    >
      <TimeBar
        start={fmtHM(v.start)}
        end={fmtHM(v.end)}
        onPressStart={() => setEdit('start')}
        onPressEnd={() => setEdit('end')}
      />
      <DayPicker
        days={v.days}
        onToggle={(i) => setV((s) => ({ ...s, days: s.days.map((x, k) => (k === i ? !x : x)) }))}
      />
      {/* iOS에서는 모달 위 모달을 띄우려면 안쪽에 렌더해야 한다 */}
      <TimeSheet
        visible={edit !== null}
        title={edit === 'end' ? '끝 시간' : '시작 시간'}
        value={edit === 'end' ? v.end : v.start}
        onClose={() => setEdit(null)}
        onApply={(t) => {
          setV((s) => (edit === 'end' ? { ...s, end: t } : { ...s, start: t }));
          setEdit(null);
        }}
      />
    </BottomSheet>
  );
}

/** 금액 단계 시트: 단계 막대 + 최대 금액 −/+ */
function StakeSheet({
  visible,
  max,
  stage,
  onClose,
  onSave,
}: {
  visible: boolean;
  max: number;
  stage: number;
  onClose: () => void;
  onSave: (v: number) => void;
}) {
  const [v, setV] = useState(max);
  useEffect(() => {
    if (visible) setV(max);
  }, [visible, max]);
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="금액 단계"
      ground
      footer={<Button label="저장" onPress={() => onSave(v)} />}
    >
      <StakeBars max={v} current={stage} />
      <AmountStepper value={v} onChange={setV} />
      <Text size={13} color="text2" body>
        금액은 언제든 바로 바꿀 수 있어요.
      </Text>
    </BottomSheet>
  );
}

export default function PromiseDetailRoute() {
  const { id, sheet } = useLocalSearchParams<{ id: string; sheet?: string }>();
  const now = useNow();
  const state = useStore();
  const [view, setView] = useState<{ year: number; month: number } | undefined>();
  const model = buildPromiseDetailModel(state, id, now, view);
  if (!model) return null;
  const shift = (dir: 1 | -1) => {
    const c = model.calendar;
    const i = c.year * 12 + (c.month - 1) + dir;
    setView({ year: Math.floor(i / 12), month: (i % 12) + 1 });
  };
  return (
    <PromiseDetailView
      model={model}
      initialSheet={sheet === 'time' || sheet === 'stake' ? sheet : undefined}
      onBack={() => (router.canGoBack() ? router.back() : go(href.home))}
      onNavigate={go}
      onPrevMonth={() => shift(-1)}
      onNextMonth={() => shift(1)}
      onSaveSchedule={(schedule) => state.updatePromise(id, { schedule })}
      onSaveMax={(maxAmount) => state.updatePromise(id, { maxAmount })}
    />
  );
}
