import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius } from '../theme';
import { Icon } from './Icon';
import { Led, type LedState } from './Led';
import { ProBadge, Text } from './Text';

/** 흰 목록 카드. 안에 ListRow·SettingRow를 넣는다 */
export function ListCard({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <View style={styles.card}>
      {title ? (
        <Text size={13} weight="semibold" color="text3" style={{ paddingTop: 14, paddingBottom: 4 }}>
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

/** 목록 줄: LED 점 + 이름/설명 + 오른쪽 상태 (SPEC 5.2) */
export function ListRow({
  led,
  title,
  subtitle,
  right,
  onPress,
  last,
}: {
  led: LedState;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, !last && styles.divider, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={{ width: 12, alignItems: 'center' }}>
        <Led state={led} />
      </View>
      <View style={{ flex: 1 }}>
        <Text size={16} weight="semibold" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text size={12} color="text3" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </Pressable>
  );
}

/** 목록 줄 오른쪽: 두 줄 상태 */
export function RowStatus({ top, bottom, muted }: { top: ReactNode; bottom?: string; muted?: boolean }) {
  return (
    <View style={{ alignItems: 'flex-end' }}>
      {typeof top === 'string' ? (
        <Text size={14} weight={muted ? 'semibold' : 'bold'} color={muted ? 'text2' : 'ink'}>
          {top}
        </Text>
      ) : (
        top
      )}
      {bottom ? (
        <Text size={12} color="text3">
          {bottom}
        </Text>
      ) : null}
    </View>
  );
}

/** 설정 줄: 이름 (+설명) + 오른쪽 값·화살표 또는 액션 버튼 */
export function SettingRow({
  label,
  description,
  value,
  pro,
  onPress,
  action,
  last,
  chevron = true,
  danger,
}: {
  label: string;
  description?: string;
  value?: string;
  pro?: boolean;
  onPress?: () => void;
  action?: ReactNode;
  last?: boolean;
  chevron?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.setting,
        !last && styles.divider,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={{ flex: 1, gap: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text size={15} color={danger ? 'text2' : 'ink'}>
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
      {action ??
        (value !== undefined || (onPress && chevron) ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 }}>
            {value !== undefined ? (
              <Text size={14} color="text2" numberOfLines={1} style={{ flexShrink: 1 }}>
                {value}
              </Text>
            ) : null}
            {onPress && chevron ? <Icon name="chevronRight" size={16} color={colors.text2} /> : null}
          </View>
        ) : null)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingVertical: 4,
    paddingHorizontal: 18,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 72 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.lineOnSurface },
  setting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
    paddingVertical: 8,
    gap: 12,
  },
});
