import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius } from '../theme';
import { Icon } from './Icon';
import { ProBadge, Text } from './Text';

/** 선택 동그라미 (SPEC 5.2). 선택 = 검정 채움 + 흰 체크, 해제 = 흰 원 + border 1px */
export function Radio({ selected, size = 22 }: { selected: boolean; size?: number }) {
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' },
        selected
          ? { backgroundColor: colors.ink }
          : { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
      ]}
    >
      {selected ? <Icon name="check" size={Math.round(size * 0.6)} color={colors.surface} strokeWidth={3} /> : null}
    </View>
  );
}

/** 동그라미가 붙은 선택 카드 (이의제기 사유, 헬스장 인증 방식 등) */
export function OptionCard({
  selected,
  onPress,
  label,
  description,
  pro,
  right,
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
  description?: string;
  pro?: boolean;
  right?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[
        styles.option,
        { minHeight: description ? 58 : 52 },
        selected ? styles.selected : styles.unselected,
      ]}
    >
      <Radio selected={selected} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text size={15} weight="semibold">
            {label}
          </Text>
          {pro ? <ProBadge /> : null}
        </View>
        {description ? (
          <Text size={12} color="text3">
            {description}
          </Text>
        ) : null}
      </View>
      {right}
    </Pressable>
  );
}

/** 약속 고르기 카드: 선택되면 2px 검정 테두리 + 오른쪽 주황 점 */
export function ChoiceCard({
  selected,
  onPress,
  label,
  description,
  pro,
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
  description?: string;
  pro?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.choice, selected ? styles.selected : styles.unselected]}
    >
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text size={16} weight="semibold">
            {label}
          </Text>
          {pro ? <ProBadge /> : null}
        </View>
        {description ? (
          <Text size={12} color="text3">
            {description}
          </Text>
        ) : null}
      </View>
      {selected ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

/** 체크 동그라미 + 문장 (동의 항목, 체크리스트) */
export function CheckRow({
  checked,
  onPress,
  children,
}: {
  checked: boolean;
  onPress?: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onPress}
      disabled={!onPress}
      style={styles.check}
    >
      <Radio selected={checked} />
      <View style={{ flex: 1 }}>
        {typeof children === 'string' ? (
          <Text size={15} body>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </Pressable>
  );
}

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

/** 요일 7칸 토글 */
export function DayPicker({ days, onToggle }: { days: boolean[]; onToggle: (i: number) => void }) {
  return (
    <View style={styles.days}>
      {DAY_LABELS.map((label, i) => (
        <Pressable
          key={label}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: days[i] }}
          onPress={() => onToggle(i)}
          style={[styles.day, { backgroundColor: days[i] ? colors.ink : colors.surface }]}
        >
          <Text size={14} weight="semibold" color={days[i] ? 'surface' : 'text2'}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.button,
    backgroundColor: colors.surface,
  },
  selected: { borderWidth: 2, borderColor: colors.ink },
  unselected: { borderWidth: 1, borderColor: colors.border },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 4,
    borderRadius: radius.button,
    backgroundColor: colors.surface,
  },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.signal },
  check: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 6 },
  days: { flexDirection: 'row', gap: 6 },
  day: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
