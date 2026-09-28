import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { colors } from '../theme';
import { Led, type LedState } from './Led';
import { DotText, Text } from './Text';

type Props = {
  /** ink = 대기, signal = 창 열림·다시 찍기 */
  tone?: 'ink' | 'signal';
  /** 왼쪽 위 라벨 (남은 시간, 완료 시간, 판정 예정까지 등) */
  label: string;
  /** 오른쪽 위 약속 이름 */
  name?: string;
  led?: LedState;
  /** 도트 숫자 (시:분:초 8자리) */
  digits: string;
  digitsColor?: 'signal' | 'surface' | 'ink' | 'inkRaised';
  /** 결과 화면형: 제목 20px + 부연 14px */
  title?: string;
  subtitle?: string;
  /** 홈형: 아래 한 줄 왼쪽·오른쪽 */
  metaLeft?: string;
  metaRight?: string;
  onPress?: () => void;
  /** 홈 카드는 모서리 32, 결과 화면은 28 */
  variant?: 'home' | 'result';
  children?: ReactNode;
};

/** 시계 카드 (SPEC 5.2) */
export function ClockCard({
  tone = 'ink',
  label,
  name,
  led,
  digits,
  digitsColor,
  title,
  subtitle,
  metaLeft,
  metaRight,
  onPress,
  variant = 'result',
  children,
}: Props) {
  const onSignal = tone === 'signal';
  const soft = onSignal ? 'ink' : 'textOnInk';
  const strong = onSignal ? 'ink' : 'surface';
  const home = variant === 'home';
  // 도트 숫자 75px(8자리)가 좁은 화면에서도 한 줄에 들어가도록 줄인다
  const { width } = useWindowDimensions();
  const digitSize = Math.min(75, Math.floor((width - 40 - 48) / (digits.length * 0.55)));
  const content = (
    <>
      <View style={styles.row}>
        <Text size={13} weight="semibold" color={soft}>
          {label}
        </Text>
        {name ? (
          <View style={styles.nameRow}>
            <Led state={led ?? (onSignal ? 'ink' : 'on')} size={8} />
            <Text size={13} color={home ? soft : strong}>
              {name}
            </Text>
          </View>
        ) : null}
      </View>
      <DotText size={digitSize} color={digitsColor ?? (onSignal ? 'ink' : 'signal')} numberOfLines={1} ellipsizeMode="clip">
        {digits}
      </DotText>
      {title ? (
        <View style={{ gap: 4 }}>
          <Text size={20} weight="bold" color={strong} tight>
            {title}
          </Text>
          {subtitle ? (
            <Text size={14} color={soft} body>
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
      {metaLeft || metaRight ? (
        <View style={styles.row}>
          <Text size={14} color={soft}>
            {metaLeft}
          </Text>
          <Text size={14} weight="semibold" color={strong}>
            {metaRight}
          </Text>
        </View>
      ) : null}
      {children}
    </>
  );
  const style = [
    styles.card,
    home ? styles.home : styles.result,
    { backgroundColor: onSignal ? colors.signal : colors.ink },
  ];
  if (onPress)
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [style, { opacity: pressed ? 0.92 : 1 }]}>
        {content}
      </Pressable>
    );
  return <View style={style}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {},
  home: { gap: 20, paddingVertical: 26, paddingHorizontal: 24, borderRadius: 32 },
  result: { gap: 16, padding: 24, borderRadius: 28 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
