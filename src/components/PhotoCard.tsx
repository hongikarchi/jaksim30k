import { Image, StyleSheet, View } from 'react-native';

import { colors } from '../theme';
import { Text } from './Text';

type Item = { label: string; value: string };

/** 사진 카드: 왼쪽 세로 썸네일 + 오른쪽 항목 두 줄. items가 없으면 스켈레톤 */
export function PhotoCard({ uri, placeholder = '인증 사진', items }: { uri?: string; placeholder?: string; items?: Item[] }) {
  return (
    <View style={styles.card}>
      <View style={styles.thumb}>
        {uri ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <Text size={12} color="text2">
            {placeholder}
          </Text>
        )}
      </View>
      <View style={styles.items}>
        {items
          ? items.map((it) => (
              <View key={it.label} style={{ gap: 2 }}>
                <Text size={12} color="text3">
                  {it.label}
                </Text>
                <Text size={15} weight="semibold">
                  {it.value}
                </Text>
              </View>
            ))
          : [70, 55].map((w) => (
              <View key={w} style={{ gap: 6 }}>
                <SkeletonBar width="40%" height={10} />
                <SkeletonBar width={`${w}%`} height={14} />
              </View>
            ))}
      </View>
    </View>
  );
}

/** 스켈레톤 회색 막대 */
export function SkeletonBar({ width, height = 12 }: { width: `${number}%` | number; height?: number }) {
  return <View style={{ width, height, borderRadius: 5, backgroundColor: colors.fill }} />;
}

/** 진행 중 표시 점 세 개 */
export function Dots() {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[colors.signal, colors.ledOff, colors.border].map((c) => (
        <View key={c} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 14, padding: 14, borderRadius: 22, backgroundColor: colors.surface },
  thumb: {
    width: 116,
    height: 120,
    borderRadius: 14,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  items: { flex: 1, justifyContent: 'center', gap: 12 },
});
