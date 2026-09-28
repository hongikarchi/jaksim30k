/** 5. 프로 잠금 안내 (시트): 무료 사용자가 프로 기능을 누를 때 */
import { View } from 'react-native';

import { BottomSheet, Button, Caption, DotText, Icon, Tag, Text, TextButton } from '../components';
import { colors } from '../theme';

export const PRO_FEATURES = ['러닝 자동 인증', '헬스장 위치 자동 인증', '감시자 지정', '쉬어가기 한 달 4번'];

export function ProLockSheet({
  visible,
  onClose,
  title,
  onStart,
}: {
  visible: boolean;
  onClose: () => void;
  /** 예: 러닝 자동 인증은 프로에서 쓸 수 있어요 */
  title: string;
  /** 7일 무료로 시작하기 → 프로 구독 화면 */
  onStart: () => void;
}) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="프로 기능이에요"
      gap={18}
      footer={
        <>
          <Caption>월 4,900원, 체험 중 언제든 해지할 수 있어요</Caption>
          <Button label="7일 무료로 시작하기" onPress={onStart} />
          <TextButton label="다음에 할게요" onPress={onClose} />
        </>
      }
    >
      <ProLockBody title={title} />
    </BottomSheet>
  );
}

export function ProLockBody({ title }: { title: string }) {
  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
          paddingVertical: 18,
          paddingHorizontal: 20,
          borderRadius: 20,
          backgroundColor: colors.ink,
        }}
      >
        <View style={{ gap: 6, flex: 1 }}>
          <DotText size={32} color="signal">
            PRO
          </DotText>
          <Text size={15} weight="bold" color="surface">
            {title}
          </Text>
        </View>
        <Tag label="7일 무료" />
      </View>
      <View style={{ gap: 10, paddingHorizontal: 4 }}>
        {PRO_FEATURES.map((f) => (
          <View key={f} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Icon name="check" size={18} strokeWidth={2.5} />
            <Text size={15}>{f}</Text>
          </View>
        ))}
      </View>
    </>
  );
}
