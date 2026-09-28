import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radius, size } from '../theme';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'kakao' | 'white' | 'dark';

const variants: Record<
  Variant,
  { bg: string; fg: keyof typeof colors; border?: string }
> = {
  primary: { bg: colors.ink, fg: 'surface' },
  secondary: { bg: colors.surface, fg: 'ink', border: colors.border },
  kakao: { bg: colors.kakao, fg: 'kakaoText' },
  // 카메라 화면용
  white: { bg: colors.surface, fg: 'ink' },
  dark: { bg: colors.inkSoft, fg: 'surface' },
};

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

/** 메인·보조 버튼. 높이 56, 모서리 14 (SPEC 5.2) */
export function Button({ label, onPress, variant = 'primary', disabled, loading, style }: Props) {
  const v = variants[variant];
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off }}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: disabled ? colors.disabled : v.bg,
          borderWidth: v.border && !disabled ? 1 : 0,
          borderColor: v.border,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors[v.fg]} />
      ) : (
        <Text size={17} weight="semibold" color={disabled ? 'surface' : v.fg}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/** 44 높이 회색 텍스트 버튼 ("나중에 할게요") */
export function TextButton({
  label,
  onPress,
  color = 'text2',
}: {
  label: string;
  onPress?: () => void;
  color?: keyof typeof colors;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.textButton, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Text size={15} weight="semibold" color={color}>
        {label}
      </Text>
    </Pressable>
  );
}

/** 작은 액션 버튼. 검정 알약 32·16 (예약, 끝내기, 변경, 해제, 인증) */
export function PillButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: disabled ? colors.disabled : colors.ink, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Text size={13} weight="semibold" color="surface">
        {label}
      </Text>
    </Pressable>
  );
}

/** 44×44 아이콘 버튼 */
export function IconButton({
  children,
  onPress,
  label,
  round,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  label: string;
  round?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.icon,
        round && { backgroundColor: colors.surface, borderRadius: 22 },
        { opacity: pressed ? 0.6 : 1 },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

/** 화면 맨 아래 버튼 묶음. 설명 글은 버튼 위 10 간격 (SPEC 5.2) */
export function BottomActions({ children, caption }: { children: ReactNode; caption?: ReactNode }) {
  return (
    <View style={styles.actions}>
      {caption ? <Caption>{caption}</Caption> : null}
      {children}
    </View>
  );
}

/** 하단 설명 글: 13px, text-2, 가운데 정렬 */
export function Caption({ children, color = 'text2' }: { children: ReactNode; color?: keyof typeof colors }) {
  return (
    <Text size={13} color={color} align="center" body>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  button: {
    height: size.buttonHeight,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  textButton: {
    height: size.textButtonHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    height: size.pillHeight,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: size.touchTarget,
    height: size.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { gap: 10 },
});
