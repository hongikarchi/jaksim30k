/** 4. 약속 고르기 (+ 5. 프로 잠금 안내 시트): 첫 약속, 홈의 + 추가, 새 약속 만들기 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  BottomActions,
  BottomSheet,
  Button,
  ChoiceCard,
  DayPicker,
  DotText,
  Header,
  Icon,
  InfoCard,
  Screen,
  SectionLabel,
  Spacer,
  Text,
  TimeBar,
  TimeSheet,
  Title,
} from '../components';
import { DAY_LABELS, PRESETS, fmtHM, firstWindow, isCustomSchedule, presetSchedule } from '../domain/rules';
import type { HM, PromiseKind, Schedule, Window } from '../domain/types';
import { href } from '../lib/routes';
import { go, goHome } from '../lib/nav';
import { useNow, useStore } from '../store';
import { isPaymentBlocked } from '../store/engine';
import { isPro as isProSel } from '../store/selectors';
import { colors } from '../theme';
import { ProLockSheet } from './ProLockSheet';

export const GOAL_KINDS: { kind: PromiseKind; name: string; desc: string; pro?: boolean }[] = [
  { kind: 'morning', name: '미라클모닝', desc: '시간 안에 촬영 + 랜덤 미션' },
  { kind: 'run', name: '러닝', desc: '스트라바 기록 연동', pro: true },
  { kind: 'gym', name: '헬스장', desc: '헬스장 안 촬영 + 랜덤 미션' },
  { kind: 'book', name: '책읽기', desc: '페이지 촬영 + 한 줄 기록' },
  { kind: 'room', name: '방청소', desc: '체크리스트 + 같은 각도 촬영' },
];

/** 시간 시트가 고치는 자리: day가 null이면 켜진 요일 전체 */
type TimeTarget = { day: number | null; which: 'start' | 'end' };

export type GoalViewProps = {
  kind: PromiseKind;
  schedule: Schedule;
  isPro: boolean;
  /** 결제 실패 후 72시간이 지나 새 약속을 만들 수 없을 때 */
  blocked?: boolean;
  onPick: (kind: PromiseKind) => void;
  onSchedule: (schedule: Schedule) => void;
  onNext: () => void;
  onBack: () => void;
  onPro: () => void;
  onChangeCard: () => void;
  /** 갤러리용: 처음부터 열어 둘 시트 */
  initialSheet?: 'lock' | 'days';
};

export function GoalView({
  kind,
  schedule,
  isPro,
  blocked,
  onPick,
  onSchedule,
  onNext,
  onBack,
  onPro,
  onChangeCard,
  initialSheet,
}: GoalViewProps) {
  const [lockOpen, setLockOpen] = useState(initialSheet === 'lock');
  const [daysOpen, setDaysOpen] = useState(initialSheet === 'days');
  const [target, setTarget] = useState<TimeTarget | null>(null);

  const preset = PRESETS[kind];
  const first: Window = firstWindow(schedule) ?? { start: preset.start, end: preset.end };
  const custom = isCustomSchedule(schedule);
  const days = schedule.map((w) => !!w);
  const anyDay = days.some(Boolean);

  const pick = (k: GoalViewProps['kind']) => {
    if (k === 'run' && !isPro) return setLockOpen(true);
    if (k !== kind) onPick(k);
  };

  const toggleDay = (i: number) => {
    const next = schedule.slice();
    next[i] = next[i] ? null : { start: { ...first.start }, end: { ...first.end } };
    onSchedule(next);
  };

  // 요일별 시트에서 시간 시트를 열 때는 요일별 시트를 잠깐 닫았다가 다시 연다 (시트 두 장을 겹치지 않는다)
  const openTime = (t: TimeTarget) => {
    if (t.day !== null) setDaysOpen(false);
    setTarget(t);
  };
  const closeTime = () => {
    if (target?.day !== null && target?.day !== undefined) setDaysOpen(true);
    setTarget(null);
  };
  const applyTime = (v: HM) => {
    if (!target) return;
    const next = schedule.map((w, i) =>
      w && (target.day === null || target.day === i) ? { ...w, [target.which]: { ...v } } : w,
    );
    onSchedule(next);
    closeTime();
  };

  const targetValue: HM = target
    ? ((target.day !== null ? schedule[target.day] : null) ?? first)[target.which]
    : first.start;
  const targetTitle = target
    ? `${target.day !== null ? `${DAY_LABELS[target.day]}요일 ` : ''}${target.which === 'end' ? '끝 시간' : '시작 시간'}`
    : '';

  return (
    <Screen
      wide
      gap={16}
      scroll={blocked}
      footer={
        blocked ? (
          <BottomActions>
            <Button label="카드 바꾸기" onPress={onChangeCard} />
          </BottomActions>
        ) : (
          <BottomActions>
            <Button label="다음" disabled={!anyDay} onPress={onNext} />
          </BottomActions>
        )
      }
      overlay={
        <>
          <ProLockSheet
            visible={lockOpen}
            onClose={() => setLockOpen(false)}
            title="러닝 자동 인증은 프로에서 쓸 수 있어요"
            onStart={() => {
              setLockOpen(false);
              onPro();
            }}
          />
          <BottomSheet
            visible={daysOpen}
            onClose={() => setDaysOpen(false)}
            title="요일마다 다르게"
            footer={<Button label="완료" onPress={() => setDaysOpen(false)} />}
          >
            <View style={{ gap: 6 }}>
              {schedule.map((w, i) =>
                w ? (
                  <DayRow
                    key={i}
                    label={`${DAY_LABELS[i]}요일`}
                    window={w}
                    onStart={() => openTime({ day: i, which: 'start' })}
                    onEnd={() => openTime({ day: i, which: 'end' })}
                  />
                ) : null,
              )}
              {!anyDay ? (
                <Text size={14} color="text2" align="center" style={{ paddingVertical: 12 }}>
                  먼저 요일을 골라주세요
                </Text>
              ) : null}
            </View>
          </BottomSheet>
          <TimeSheet visible={!!target} title={targetTitle} value={targetValue} onClose={closeTime} onApply={applyTime} />
        </>
      }
    >
      <Header onBack={onBack} step="1 / 3" />
      <Title>어떤 약속을 할까요?</Title>
      {blocked ? (
        <InfoCard icon="info">
          결제 실패 후 72시간이 지나 새 약속을 만들 수 없어요. 카드를 바꾸면 밀린 금액이 결제되고 다시 만들 수 있어요.
        </InfoCard>
      ) : null}
      <View style={{ gap: 8 }}>
        {GOAL_KINDS.map((c) => (
          <ChoiceCard
            key={c.kind}
            selected={c.kind === kind}
            onPress={() => pick(c.kind)}
            label={c.name}
            description={c.desc}
            pro={c.pro}
          />
        ))}
      </View>
      <View style={{ gap: 10 }}>
        <SectionLabel>인증 시간</SectionLabel>
        {custom ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setDaysOpen(true)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: 72,
              paddingHorizontal: 20,
              borderRadius: 16,
              backgroundColor: colors.ink,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text size={18} weight="bold" color="signal">
              요일마다 달라요
            </Text>
            <Text size={13} weight="semibold" color="textOnInk">
              수정
            </Text>
          </Pressable>
        ) : (
          <TimeBar
            start={fmtHM(first.start)}
            end={fmtHM(first.end)}
            onPressStart={() => openTime({ day: null, which: 'start' })}
            onPressEnd={() => openTime({ day: null, which: 'end' })}
          />
        )}
      </View>
      <View style={{ gap: 10 }}>
        <SectionLabel>요일</SectionLabel>
        <DayPicker days={days} onToggle={toggleDay} />
        <Pressable
          accessibilityRole="button"
          onPress={() => setDaysOpen(true)}
          hitSlop={6}
          style={{ alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 2, height: 32 }}
        >
          <Text size={13} weight="semibold" color="text2">
            요일마다 다르게 설정
          </Text>
          <Icon name="chevronRight" size={16} color={colors.text2} />
        </Pressable>
      </View>
      <Spacer />
    </Screen>
  );
}

function DayRow({ label, window: w, onStart, onEnd }: { label: string; window: Window; onStart: () => void; onEnd: () => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 52,
        paddingLeft: 16,
        paddingRight: 12,
        borderRadius: 14,
        backgroundColor: colors.ink,
      }}
    >
      <Text size={15} weight="bold" color="surface">
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${label} 시작 시간 바꾸기`} onPress={onStart} style={{ height: 40, paddingHorizontal: 6, justifyContent: 'center' }}>
          <DotText size={24} color="signal">
            {fmtHM(w.start)}
          </DotText>
        </Pressable>
        <DotText size={20} color="signal">
          ~
        </DotText>
        <Pressable accessibilityRole="button" accessibilityLabel={`${label} 끝 시간 바꾸기`} onPress={onEnd} style={{ height: 40, paddingHorizontal: 6, justifyContent: 'center' }}>
          <DotText size={24} color="signal">
            {fmtHM(w.end)}
          </DotText>
        </Pressable>
      </View>
    </View>
  );
}

export default function GoalRoute() {
  const now = useNow();
  const state = useStore();
  const { draft, startDraft, updateDraft } = state;

  useEffect(() => {
    if (!useStore.getState().draft) startDraft('morning');
  }, [startDraft]);

  const kind = draft?.kind ?? 'morning';
  const schedule = draft?.schedule ?? presetSchedule(kind);

  const onNext = () => {
    const s = useStore.getState();
    const k = s.draft?.kind ?? kind;
    if (k === 'run') go(s.user?.stravaConnected ? href.stake : href.runConnect);
    else if (k === 'gym') go(href.gymMethod);
    else if (k === 'room') go(href.roomSetup);
    else go(href.stake);
  };

  return (
    <GoalView
      kind={kind}
      schedule={schedule}
      isPro={isProSel(state)}
      blocked={isPaymentBlocked(state, now)}
      onPick={(k) => startDraft(k)}
      onSchedule={(s) => updateDraft({ schedule: s })}
      onNext={onNext}
      onBack={() => (router.canGoBack() ? router.back() : goHome())}
      onPro={() => go(href.pro)}
      onChangeCard={() => go(href.paymentFailed)}
    />
  );
}
