/** 2. 로그인: 카카오·애플, 가입과 로그인 겸용 */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, BottomActions, DotText, Header, Led, Screen, Spacer, Text } from '../components';
import { href } from '../lib/routes';
import { goHome, replace } from '../lib/nav';
import { useStore } from '../store';
import { activePromises } from '../store/selectors';
import { colors } from '../theme';

type Provider = 'kakao' | 'apple';

export function LoginView({
  onBack,
  onLogin,
  busy,
}: {
  onBack: () => void;
  onLogin: (p: Provider) => void;
  /** 로그인 처리 중인 버튼 */
  busy?: Provider | null;
}) {
  return (
    <Screen
      wide
      gap={28}
      footer={
        <BottomActions
          caption={'만 19세 이상만 이용할 수 있어요.\n계속하면 이용약관과 개인정보 처리방침에 동의하게 돼요.'}
        >
          <Button label="카카오로 계속하기" variant="kakao" loading={busy === 'kakao'} onPress={() => onLogin('kakao')} />
          <Button label="Apple로 계속하기" loading={busy === 'apple'} onPress={() => onLogin('apple')} />
        </BottomActions>
      }
    >
      <Header onBack={onBack} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            backgroundColor: colors.ink,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DotText size={20} color="signal">
            6:00
          </DotText>
        </View>
        <Led state="on" size={10} />
      </View>
      <View style={{ gap: 10 }}>
        <Text size={28} weight="bold" tight="more" style={{ lineHeight: 36 }}>
          {'약속은 한 사람과\n하는 거니까요'}
        </Text>
        <Text size={16} color="text2" body>
          로그인하면 약속과 기록이 기기를 바꿔도 이어져요.
        </Text>
      </View>
      <Spacer />
    </Screen>
  );
}

export default function LoginRoute() {
  const [busy, setBusy] = useState<Provider | null>(null);

  const onLogin = (provider: Provider) => {
    if (busy) return;
    setBusy(provider);
    // 가짜 로그인: 버튼이 눌린 느낌만 잠깐 보여준다
    setTimeout(() => {
      const s = useStore.getState();
      s.login(provider);
      const d = useStore.getState();
      setBusy(null);
      if (activePromises(d).length > 0) goHome();
      else if (d.user && !d.user.permissions.notifications && !d.user.permissions.camera) replace(href.permissions);
      else replace(href.goal);
    }, 400);
  };

  return (
    <LoginView
      busy={busy}
      onLogin={onLogin}
      onBack={() => (router.canGoBack() ? router.back() : replace(href.welcome))}
    />
  );
}
