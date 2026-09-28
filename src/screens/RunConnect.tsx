/** 6. 러닝 연결: 러닝 선택 후(프로). 스트라바 기록으로 자동 인증 (SPEC 2.1) */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import {
  BottomActions,
  Button,
  DotText,
  Header,
  KeyValueRow,
  Led,
  ProBadge,
  Screen,
  Spacer,
  Text,
  Title,
} from '../components';
import { presetSchedule } from '../domain/rules';
import type { Schedule } from '../domain/types';
import { href } from '../lib/routes';
import { go, goHome } from '../lib/nav';
import { useStore } from '../store';
import { RUN_MIN_KM } from '../store/engine';
import { colors } from '../theme';

export function RunConnectView({
  schedule,
  connected,
  busy,
  onBack,
  onConnect,
  onNext,
}: {
  schedule: Schedule;
  connected: boolean;
  busy?: boolean;
  onBack: () => void;
  onConnect: () => void;
  onNext: () => void;
}) {
  const days = schedule.map((w) => !!w);
  const count = days.filter(Boolean).length;
  return (
    <Screen
      wide
      gap={22}
      footer={
        connected ? (
          <BottomActions caption="스트라바와 연결됐어요. 지금은 테스트 연결이에요.">
            <Button label="다음" onPress={onNext} />
          </BottomActions>
        ) : (
          <BottomActions caption="연결이 끊기면 알려드려요. 끊긴 동안은 결제되지 않아요.">
            <Button label="스트라바 연결하기" loading={busy} onPress={onConnect} />
          </BottomActions>
        )
      }
    >
      <Header onBack={onBack} right={<ProBadge />} />
      <Title sub="스트라바에 올라온 기록을 확인해요. 워치 기록도 스트라바로 모이면 돼요.">
        {'달린 기록으로\n자동 인증할게요'}
      </Title>
      <View style={{ gap: 16, padding: 24, borderRadius: 24, backgroundColor: colors.ink }}>
        <Text size={13} weight="semibold" color="textOnInk">
          주간 목표
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
          <DotText size={64} color="signal">
            {String(count)}
          </DotText>
          <Text size={18} weight="semibold" color="surface">
            회 / 주
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {days.map((on, i) => (
            <View
              key={i}
              style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: on ? colors.signal : colors.inkRaised }}
            />
          ))}
        </View>
      </View>
      <View style={{ borderTopWidth: 1, borderTopColor: colors.lineOnGround }}>
        <KeyValueRow onGround label="한 번에" value={`${RUN_MIN_KM}km 이상`} />
        <KeyValueRow onGround label="인정하는 기록" value="정한 요일·시간 안" />
        <KeyValueRow onGround label="인정하지 않는 기록" value="수동 입력" />
        <KeyValueRow
          onGround
          label="스트라바"
          value={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Led state={connected ? 'glow' : 'off'} size={8} />
              <Text size={15} weight="semibold" color={connected ? 'ink' : 'text2'}>
                {connected ? '연결됨' : '연결 전'}
              </Text>
            </View>
          }
        />
      </View>
      <Spacer />
    </Screen>
  );
}

export default function RunConnectRoute() {
  const draft = useStore((s) => s.draft);
  const connected = useStore((s) => !!s.user?.stravaConnected);
  const [busy, setBusy] = useState(false);

  const onConnect = () => {
    if (busy) return;
    setBusy(true);
    // 가짜 연결: 스트라바 인증 창 대신 잠깐 기다린다
    setTimeout(() => {
      useStore.getState().connectStrava();
      setBusy(false);
    }, 600);
  };

  return (
    <RunConnectView
      schedule={draft?.schedule ?? presetSchedule('run')}
      connected={connected}
      busy={busy}
      onBack={() => (router.canGoBack() ? router.back() : goHome())}
      onConnect={onConnect}
      onNext={() => go(href.stake)}
    />
  );
}
