import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout } from '../theme';
import { Text } from './Text';

/**
 * 하단 시트 (SPEC 5.2): 반투명 검정 덮개 + 위쪽 모서리 28의 패널, 제목 + ×, 맨 아래 메인 버튼
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  footer,
  ground,
  gap = 16,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
  footer?: ReactNode;
  /** 패널 바탕을 흰색 대신 ground로 (흰 카드를 올릴 때) */
  ground?: boolean;
  gap?: number;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="닫기" />
        <View
          style={[
            styles.panel,
            {
              gap,
              backgroundColor: ground ? colors.ground : colors.surface,
              paddingBottom: Math.max(layout.bottom, insets.bottom + 12),
            },
          ]}
        >
          <View style={styles.head}>
            <Text size={18} weight="bold" style={{ flex: 1 }}>
              {title}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="닫기" onPress={onClose} style={styles.x}>
              <Text size={22} color="text2">
                ×
              </Text>
            </Pressable>
          </View>
          {children}
          {footer ? <View style={{ gap: 8 }}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  panel: {
    paddingTop: 24,
    paddingHorizontal: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  x: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
});
