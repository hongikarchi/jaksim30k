import { StyleSheet, View } from 'react-native';

import { colors } from '../theme';
import { StepButton } from './TimeInput';
import { Text } from './Text';

export const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

/** 금액 단계 막대: 1번째 0원 → 2번째 5,000원 → 3번째 10,000원 → 4번째부터 최대 금액 */
export function StakeBars({ max, current }: { max: number; current?: number }) {
  const steps = [0, Math.min(5000, max), Math.min(10000, max), max];
  const labels = ['1번째', '2번째', '3번째', '4번째~'];
  return (
    <View style={styles.card}>
      {steps.map((v, i) => (
        <View key={labels[i]} style={styles.row}>
          <Text size={13} color={current === i ? 'ink' : 'text2'} weight={current === i ? 'bold' : 'regular'} style={{ width: 64 }}>
            {labels[i]}
          </Text>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${Math.round((v / max) * 100)}%`, backgroundColor: i === 3 ? colors.signal : colors.ink },
              ]}
            />
          </View>
          <Text size={16} weight="semibold" align="right" style={{ width: 84 }}>
            {i === 0 ? '연습 0원' : won(v)}
          </Text>
        </View>
      ))}
    </View>
  );
}

export const MAX_OPTIONS = [10000, 20000, 30000, 50000, 100000];

/** 최대 금액 −/+ */
export function AmountStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const k = Math.max(0, MAX_OPTIONS.indexOf(value));
  return (
    <View style={styles.stepper}>
      <StepButton
        label="최대 금액 낮추기"
        sign="−"
        radius={12}
        disabled={k === 0}
        onPress={() => onChange(MAX_OPTIONS[Math.max(0, k - 1)])}
      />
      <Text size={26} weight="bold" tight>
        {won(value)}
      </Text>
      <StepButton
        label="최대 금액 높이기"
        sign="+"
        radius={12}
        disabled={k === MAX_OPTIONS.length - 1}
        onPress={() => onChange(MAX_OPTIONS[Math.min(MAX_OPTIONS.length - 1, k + 1)])}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 18, backgroundColor: colors.surface },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  track: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.border },
  fill: { height: 10, borderRadius: 5 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
