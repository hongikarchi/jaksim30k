import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radius } from '../theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

/** 흰 카드 */
export function Card({
  children,
  style,
  padding = 20,
  onPress,
}: {
  children: ReactNode;
  style?: ViewStyle;
  padding?: number;
  onPress?: () => void;
}) {
  const s = [styles.card, { padding }, style];
  if (onPress)
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [s, { opacity: pressed ? 0.85 : 1 }]}>
        {children}
      </Pressable>
    );
  return <View style={s}>{children}</View>;
}

/** 아이콘 + 안내 문장 카드 (본문 14px, text-body) */
export function InfoCard({
  children,
  icon = 'check',
  muted,
}: {
  children: ReactNode;
  icon?: IconName | null;
  /** 설명 글 톤(text-2) */
  muted?: boolean;
}) {
  return (
    <View style={styles.info}>
      {icon ? (
        <View style={{ marginTop: 1 }}>
          <Icon name={icon} size={20} color={muted ? colors.text2 : colors.ink} />
        </View>
      ) : null}
      <Text size={14} color={muted ? 'text2' : 'textBody'} body style={{ flex: 1 }}>
        {children}
      </Text>
    </View>
  );
}

/** 라벨 + 값 한 줄 (결제될 금액 표 같은 곳). 흰 카드 안에서 구분선과 함께 쓴다 */
export function KeyValueRow({
  label,
  value,
  last,
  onGround,
}: {
  label: string;
  value: ReactNode;
  last?: boolean;
  /** 회색 바탕 위에 바로 놓일 때 */
  onGround?: boolean;
}) {
  return (
    <View
      style={[
        styles.kv,
        !last && {
          borderBottomWidth: 1,
          borderBottomColor: onGround ? colors.lineOnGround : colors.lineOnSurface,
        },
      ]}
    >
      <Text size={15} color="text3">
        {label}
      </Text>
      {typeof value === 'string' ? (
        <Text size={15} weight="semibold" style={{ flexShrink: 1, textAlign: 'right' }}>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}

/** 통계 카드 쌍: 왼쪽 검정 + 주황 도트 숫자, 오른쪽 흰색 + 검정 도트 숫자 */
export function StatPair({
  left,
  right,
}: {
  left: { label: string; value: ReactNode };
  right: { label: string; value: ReactNode };
}) {
  return (
    <View style={styles.pair}>
      <View style={[styles.stat, { backgroundColor: colors.ink }]}>
        <Text size={13} color="textOnInk">
          {left.label}
        </Text>
        {left.value}
      </View>
      <View style={[styles.stat, { backgroundColor: colors.surface }]}>
        <Text size={13} color="text3">
          {right.label}
        </Text>
        {right.value}
      </View>
    </View>
  );
}

/** 작은 태그 (꼭 필요, 7일 무료 등) */
export function Tag({ label, tone = 'signal' }: { label: string; tone?: 'signal' | 'ink' | 'fill' }) {
  const bg = tone === 'signal' ? colors.signal : tone === 'ink' ? colors.ink : colors.fill;
  const fg = tone === 'ink' ? 'surface' : 'ink';
  return (
    <View style={{ backgroundColor: bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Text size={11} weight="bold" color={fg}>
        {label}
      </Text>
    </View>
  );
}

/** 검정 네모 아이콘 틀 (권한 요청 카드 등) */
export function IconTile({ name, size = 44, tone = 'ink' }: { name: IconName; size?: number; tone?: 'ink' | 'signal' | 'soft' }) {
  const bg = tone === 'ink' ? colors.ink : tone === 'signal' ? colors.signalGlow : colors.inkSoft;
  const fg = tone === 'signal' ? colors.signal : colors.surface;
  return (
    <View style={{ width: size, height: size, borderRadius: radius.button, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} size={Math.round(size * 0.46)} color={fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.card },
  info: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  kv: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  pair: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, gap: 4, paddingVertical: 16, paddingHorizontal: 18, borderRadius: 20 },
});
