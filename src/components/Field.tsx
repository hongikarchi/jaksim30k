import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts, radius } from '../theme';
import { Text } from './Text';

/** 입력칸: 흰 바탕 + border 1px, 모서리 14 */
export function Field({ multiline, style, ...rest }: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.text3}
      multiline={multiline}
      {...rest}
      style={[
        styles.field,
        multiline ? { minHeight: 96, paddingTop: 14, paddingBottom: 14, textAlignVertical: 'top' } : { height: 52 },
        style,
      ]}
    />
  );
}

/** 켜고 끄는 스위치 (알림 설정) */
export function Toggle({ on, onPress, disabled }: { on: boolean; onPress?: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on, disabled }}
      onPress={onPress}
      disabled={disabled}
      style={[styles.track, { backgroundColor: on ? colors.ink : colors.lineOnGround, opacity: disabled ? 0.5 : 1 }]}
    >
      <View style={[styles.knob, { alignSelf: on ? 'flex-end' : 'flex-start', backgroundColor: on ? colors.signal : colors.surface }]} />
    </Pressable>
  );
}

/** 여러 선택지 중 하나 (알림 시점 5·10·30분 등) */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  format = String,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  format?: (v: T) => string;
}) {
  return (
    <View style={styles.segment}>
      {options.map((o) => (
        <Pressable
          key={String(o)}
          onPress={() => onChange(o)}
          style={[styles.segItem, o === value && { backgroundColor: colors.ink }]}
        >
          <Text size={13} weight="semibold" color={o === value ? 'surface' : 'text2'}>
            {format(o)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    fontFamily: fonts.body.regular,
    fontSize: 15,
    color: colors.ink,
  },
  track: { width: 50, height: 30, borderRadius: 15, padding: 3, justifyContent: 'center' },
  knob: { width: 24, height: 24, borderRadius: 12 },
  segment: { flexDirection: 'row', gap: 6 },
  segItem: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
});
