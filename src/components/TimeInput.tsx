import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '../theme';
import { Button } from './Button';
import { BottomSheet } from './Sheet';
import { DotText, Text } from './Text';

export type HM = { h: number; m: number };

export const fmtHM = (t: HM) => `${String(t.h).padStart(2, '0')}:${String(t.m).padStart(2, '0')}`;

/** 분은 10분 단위 + 59 (SPEC 5.2) */
const MINUTE_STEPS = [0, 10, 20, 30, 40, 50, 59];

/** 시간 입력: 검정 바 안의 주황 도트 숫자. 한 개 또는 시작~끝 두 개 */
export function TimeBar({
  start,
  end,
  onPressStart,
  onPressEnd,
  label,
}: {
  start: string;
  end?: string;
  onPressStart: () => void;
  onPressEnd?: () => void;
  label?: string;
}) {
  return (
    <View style={styles.bar}>
      <Pressable accessibilityRole="button" accessibilityLabel={label ?? '시작 시간 바꾸기'} onPress={onPressStart} hitSlop={8}>
        <DotText size={40} color="signal">
          {start}
        </DotText>
      </Pressable>
      {end !== undefined ? (
        <>
          <DotText size={40} color="signal">
            ~
          </DotText>
          <Pressable accessibilityRole="button" accessibilityLabel="끝 시간 바꾸기" onPress={onPressEnd} hitSlop={8}>
            <DotText size={40} color="signal">
              {end}
            </DotText>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

/** −/+ 두 칸으로 값을 조절하는 하단 시트 (시·분, 시간·분) */
export function TimeSheet({
  visible,
  title,
  value,
  onClose,
  onApply,
  labels = ['시', '분'],
  duration,
}: {
  visible: boolean;
  title: string;
  value: HM;
  onClose: () => void;
  onApply: (v: HM) => void;
  labels?: [string, string];
  /** 머무를 시간처럼 길이를 고를 때: 시간 0~5, 분 10분 단위 */
  duration?: boolean;
}) {
  const [tmp, setTmp] = useState(value);
  useEffect(() => {
    if (visible) setTmp(value);
  }, [visible, value]);

  const bump = (part: 'h' | 'm', dir: 1 | -1) => {
    setTmp((t) => {
      if (part === 'h') {
        const max = duration ? 6 : 24;
        return { ...t, h: (t.h + dir + max) % max };
      }
      const steps = duration ? [0, 10, 20, 30, 40, 50] : MINUTE_STEPS;
      let k = steps.indexOf(t.m);
      if (k < 0) k = 0;
      return { ...t, m: steps[(k + dir + steps.length) % steps.length] };
    });
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={title}
      gap={22}
      footer={
        <Button
          label="확인"
          disabled={duration && tmp.h === 0 && tmp.m === 0}
          onPress={() => onApply(tmp)}
        />
      }
    >
      <View style={styles.sheetRow}>
        <Stepper label={labels[0]} value={tmp.h} onDown={() => bump('h', -1)} onUp={() => bump('h', 1)} />
        <DotText size={36} color="text3" style={{ paddingTop: 22 }}>
          :
        </DotText>
        <Stepper label={labels[1]} value={tmp.m} onDown={() => bump('m', -1)} onUp={() => bump('m', 1)} />
      </View>
    </BottomSheet>
  );
}

function Stepper({ label, value, onDown, onUp }: { label: string; value: number; onDown: () => void; onUp: () => void }) {
  return (
    <View style={{ alignItems: 'center', gap: 10, flex: 1 }}>
      <Text size={12} color="text3">
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <StepButton label={`${label} 줄이기`} sign="−" onPress={onDown} />
        <DotText size={44} style={{ width: 56, textAlign: 'center' }}>
          {String(value).padStart(2, '0')}
        </DotText>
        <StepButton label={`${label} 늘리기`} sign="+" onPress={onUp} />
      </View>
    </View>
  );
}

export function StepButton({
  label,
  sign,
  onPress,
  disabled,
  radius = 14,
}: {
  label: string;
  sign: '−' | '+';
  onPress: () => void;
  disabled?: boolean;
  radius?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.step, { borderRadius: radius, opacity: pressed ? 0.7 : 1 }]}
    >
      <Text size={22} color={disabled ? 'textOnInk' : 'ink'}>
        {sign}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    height: 72,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: colors.ink,
  },
  sheetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  step: { width: 48, height: 48, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center' },
});
