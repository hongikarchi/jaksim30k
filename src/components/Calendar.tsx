import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '../theme';
import { Icon } from './Icon';
import { Text } from './Text';

/**
 * 날짜 칸 상태
 * kept = 지킨 날(검정), missed = 놓친 날(주황), rest = 약속 없는 날·쉰 날(회색 채움),
 * today = 오늘(검정 테두리), upcoming = 앞으로 있을 약속(흰 칸 + 테두리), none = 칸만
 */
export type DayMark = 'kept' | 'missed' | 'rest' | 'today' | 'upcoming' | 'none';

type Props = {
  year: number;
  /** 1~12 */
  month: number;
  marks: Record<number, DayMark>;
  onPrev?: () => void;
  onNext?: () => void;
  /** 누를 수 있는 날 (쉬어가기 예약) */
  onPressDay?: (day: number) => void;
  selectable?: (day: number) => boolean;
  selected?: number[];
};

const WEEK = ['월', '화', '수', '목', '금', '토', '일'];

/** 달력 (월요일 시작, 앞뒤 달 날짜는 흐리게) */
export function Calendar({ year, month, marks, onPrev, onNext, onPressDay, selectable, selected = [] }: Props) {
  const first = new Date(year, month - 1, 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(year, month, 0).getDate();
  const prevDays = new Date(year, month - 1, 0).getDate();
  const total = Math.ceil((lead + days) / 7) * 7;
  const cells = Array.from({ length: total }, (_, i) => {
    const d = i - lead + 1;
    if (d < 1) return { day: prevDays + d, inMonth: false };
    if (d > days) return { day: d - days, inMonth: false };
    return { day: d, inMonth: true };
  });

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Pressable accessibilityLabel="이전 달" onPress={onPrev} disabled={!onPrev} style={styles.nav}>
          <Icon name="back" size={18} color={onPrev ? colors.ink : colors.border} />
        </Pressable>
        <Text size={15} weight="semibold">
          {year}년 {month}월
        </Text>
        <Pressable accessibilityLabel="다음 달" onPress={onNext} disabled={!onNext} style={styles.nav}>
          <Icon name="chevronRight" size={18} color={onNext ? colors.ink : colors.border} />
        </Pressable>
      </View>
      <View style={styles.grid}>
        {WEEK.map((w) => (
          <View key={w} style={styles.cellWrap}>
            <Text size={12} color="text3" align="center">
              {w}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((c, i) => {
          if (!c.inMonth)
            return (
              <View key={i} style={styles.cellWrap}>
                <View style={styles.cell}>
                  <Text size={12} weight="medium" color="textOnInk">
                    {c.day}
                  </Text>
                </View>
              </View>
            );
          const isSelected = selected.includes(c.day);
          const mark = isSelected ? 'selected' : (marks[c.day] ?? 'none');
          const canPress = !!onPressDay && (!selectable || selectable(c.day));
          const look = cellLook[mark];
          return (
            <View key={i} style={styles.cellWrap}>
              <Pressable
                disabled={!canPress}
                onPress={() => onPressDay?.(c.day)}
                style={[styles.cell, look.box]}
              >
                <Text size={12} weight="semibold" color={look.fg}>
                  {c.day}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const cellLook = {
  kept: { box: { backgroundColor: colors.ink }, fg: 'surface' },
  missed: { box: { backgroundColor: colors.signal }, fg: 'ink' },
  rest: { box: { backgroundColor: colors.fill }, fg: 'text3' },
  today: { box: { backgroundColor: colors.fill, borderWidth: 2, borderColor: colors.ink }, fg: 'ink' },
  upcoming: { box: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, fg: 'text3' },
  none: { box: {}, fg: 'text3' },
  selected: { box: { backgroundColor: colors.signal }, fg: 'ink' },
} as const;

const styles = StyleSheet.create({
  card: { gap: 8, paddingTop: 12, paddingHorizontal: 16, paddingBottom: 14, borderRadius: 22, backgroundColor: colors.surface },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nav: { width: 44, height: 36, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 5 },
  cellWrap: { width: `${100 / 7}%`, paddingHorizontal: 2.5 },
  cell: { height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
});
