/** 43. 감시자가 받는 메시지: 카카오톡 알림톡 미리보기 + 수락 대기 */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';

import { BottomActions, Button, DotText, Header, Led, PillButton, Screen, Text } from '../components';
import { firstWindow, fmtHM, scheduleSummary } from '../domain/rules';
import type { Watcher } from '../domain/types';
import { href } from '../lib/routes';
import { replace } from '../lib/nav';
import { colors } from '../theme';
import { useStore } from '../store';
import { promiseTitle } from '../store/selectors';

// 카카오톡 대화 흉내 화면에서만 쓰는 값 (SPEC 5.1: 한 화면 전용 값은 토큰에 넣지 않는다)
const CHAT_BG = '#B2C7D9';
const CHAT_CHIP = 'rgba(0, 0, 0, 0.12)';

const APP_NAME = '작심삼만원';

export type WatcherMessageModel = {
  userName: string;
  promiseName: string;
  /** 평일 06:00–06:10 */
  schedule: string;
  /** 06:00–06:10 */
  window: string;
  watcherName: string;
  scope: Watcher['scope'];
};

export function WatcherMessageView({
  model: m,
  onBack,
  onDone,
  onCancel,
}: {
  model: WatcherMessageModel;
  onBack: () => void;
  onDone: () => void;
  onCancel: () => void;
}) {
  const inviteBody =
    m.scope === 'missed'
      ? `${m.promiseName} 약속(${m.schedule})을 놓치면 알려드릴게요. 따로 할 일은 없어요.`
      : `${m.promiseName} 약속(${m.schedule}) 결과를 매일 알려드릴게요. 따로 할 일은 없어요.`;
  return (
    <Screen
      scroll
      footer={
        <BottomActions>
          <Button label="확인" onPress={onDone} />
        </BottomActions>
      }
    >
      <Header onBack={onBack} title="감시자가 받는 메시지" />
      <Text size={13} color="text2" style={{ paddingHorizontal: 4, marginTop: -4 }}>
        카카오톡 알림톡으로 이렇게 보여요
      </Text>
      <View style={{ gap: 18, paddingVertical: 18, paddingHorizontal: 14, borderRadius: 22, backgroundColor: CHAT_BG }}>
        <Chip label="초대했을 때" />
        <Bubble>
          <Text size={15} weight="bold">
            {m.userName}님이 감시자로 초대했어요
          </Text>
          <Text size={14} color="textBody" body>
            {inviteBody}
          </Text>
          <BubbleButton label="감시자 되기" dark />
        </Bubble>
        <Chip label="약속을 놓친 날" />
        <Bubble>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Led state="on" size={8} />
            <Text size={15} weight="bold" style={{ flexShrink: 1 }}>
              {m.userName}님이 오늘 약속을 놓쳤어요
            </Text>
          </View>
          <Text size={14} color="textBody" body>
            {m.promiseName} {m.window} 인증이 없었어요. 한마디 건네보는 건 어때요?
          </Text>
          <BubbleButton label="응원 보내기" />
        </Bubble>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 60,
          paddingLeft: 16,
          paddingRight: 12,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 }}>
          <Avatar name={m.watcherName} />
          <View style={{ flexShrink: 1 }}>
            <Text size={15} weight="semibold" numberOfLines={1}>
              {m.watcherName}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Led state="off" size={6} />
              <Text size={12} color="text3">
                수락을 기다리고 있어요
              </Text>
            </View>
          </View>
        </View>
        <PillButton label="취소" onPress={onCancel} />
      </View>
    </Screen>
  );
}

/** 이름 첫 글자 동그라미 (44 감시자 연결됨과 같은 모양) */
export function Avatar({ name }: { name: string }) {
  return (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.ink,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text size={13} weight="bold" color="signal">
        {name.slice(0, 1)}
      </Text>
    </View>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View style={{ alignSelf: 'center', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10, backgroundColor: CHAT_CHIP }}>
      <Text size={11} color="surface">
        {label}
      </Text>
    </View>
  );
}

function Bubble({ children }: { children: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          backgroundColor: colors.ink,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <DotText size={13} color="signal">
          6:00
        </DotText>
      </View>
      <View style={{ gap: 6, flex: 1, maxWidth: 280 }}>
        <Text size={13} color="text2">
          {APP_NAME}
        </Text>
        <View style={{ gap: 10, padding: 16, borderRadius: 16, backgroundColor: colors.surface }}>{children}</View>
      </View>
    </View>
  );
}

function BubbleButton({ label, dark }: { label: string; dark?: boolean }) {
  return (
    <View
      style={{
        height: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: dark ? colors.ink : colors.fill,
      }}
    >
      <Text size={14} weight="semibold" color={dark ? 'surface' : 'ink'}>
        {label}
      </Text>
    </View>
  );
}

export default function WatcherMessageRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = useStore((s) => s.promises[id]);
  const userName = useStore((s) => s.user?.name ?? '');
  const removeWatcher = useStore((s) => s.removeWatcher);
  const status = p?.watcher?.status;

  // 감시자가 수락하면 연결됨 화면으로
  useEffect(() => {
    if (status === 'connected') replace(href.watcherConnected(id));
  }, [status, id]);

  if (!p || !p.watcher) return null;
  const w = firstWindow(p.schedule);
  return (
    <WatcherMessageView
      model={{
        userName,
        promiseName: promiseTitle(p),
        schedule: scheduleSummary(p.schedule),
        window: w ? `${fmtHM(w.start)}–${fmtHM(w.end)}` : '',
        watcherName: p.watcher.name,
        scope: p.watcher.scope,
      }}
      onBack={() => router.back()}
      onDone={() => router.back()}
      onCancel={() => {
        removeWatcher(id);
        router.back();
      }}
    />
  );
}
