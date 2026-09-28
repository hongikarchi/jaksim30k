/** 3. 권한 요청: 처음 가입한 사용자, 알림·카메라 (SPEC 2.6) */
import { Camera } from 'expo-camera';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, View } from 'react-native';

import { Button, BottomActions, Header, Icon, Screen, Spacer, Tag, Text, Title, type IconName } from '../components';
import { href } from '../lib/routes';
import { replace } from '../lib/nav';
import { requestNotificationPermission } from '../lib/notifications';
import { useStore } from '../store';
import { colors, radius } from '../theme';

const ITEMS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'bell', title: '알림', body: '인증 시간이 되면 깨워드려요. 알림이 꺼져 있으면 약속을 놓치기 쉬워요.' },
  { icon: 'camera', title: '카메라', body: '앱 안에서 바로 찍은 사진만 인증으로 인정돼요.' },
];

export function PermissionsView({
  onBack,
  onAllow,
  busy,
}: {
  onBack?: () => void;
  onAllow: () => void;
  busy?: boolean;
}) {
  return (
    <Screen
      footer={
        <BottomActions caption="휴대폰 설정에서 언제든 바꿀 수 있어요">
          <Button label="허용하고 계속하기" loading={busy} onPress={onAllow} />
        </BottomActions>
      }
    >
      <Header onBack={onBack} />
      <View style={{ paddingHorizontal: 4 }}>
        <Title>{'약속을 지키려면\n두 가지가 필요해요'}</Title>
      </View>
      {ITEMS.map((it) => (
        <View
          key={it.title}
          style={{
            flexDirection: 'row',
            gap: 14,
            alignItems: 'flex-start',
            padding: 20,
            borderRadius: radius.card,
            backgroundColor: colors.surface,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: radius.button,
              backgroundColor: colors.ink,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={it.icon} size={22} color={colors.signal} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text size={16} weight="bold">
                {it.title}
              </Text>
              <Tag label="꼭 필요" />
            </View>
            <Text size={14} color="text2" body>
              {it.body}
            </Text>
          </View>
        </View>
      ))}
      <Spacer />
    </Screen>
  );
}

async function requestCamera() {
  // 웹에서는 카메라 권한을 미리 받지 않는다 (촬영 화면에서 다시 확인)
  if (Platform.OS === 'web') return false;
  try {
    const res = await Camera.requestCameraPermissionsAsync();
    return res.granted;
  } catch {
    return false;
  }
}

export default function PermissionsRoute() {
  const [busy, setBusy] = useState(false);

  const onAllow = async () => {
    if (busy) return;
    setBusy(true);
    let notifications = false;
    try {
      notifications = await requestNotificationPermission();
    } catch {
      notifications = false;
    }
    const camera = await requestCamera();
    useStore.getState().grantPermissions({ notifications, camera });
    setBusy(false);
    // 거절해도 약속 만들기는 이어간다. 촬영 화면에서 다시 요청한다
    replace(href.goal);
  };

  return <PermissionsView busy={busy} onAllow={onAllow} onBack={router.canGoBack() ? () => router.back() : undefined} />;
}
