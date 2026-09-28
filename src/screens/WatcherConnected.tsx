/** 44. 감시자 연결됨: 알릴 범위 바꾸기 + 해제 */
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { BottomActions, Button, Header, Led, PillButton, Screen, SectionLabel, Text } from '../components';
import { dayLabel } from '../domain/rules';
import type { Watcher } from '../domain/types';
import { colors } from '../theme';
import { useStore } from '../store';
import { promiseTitle } from '../store/selectors';
import { Avatar } from './WatcherMessage';
import { ScopePicker, WatcherIntro, type WatcherScope } from './WatcherSetup';

export function WatcherConnectedView({
  promiseName,
  watcher,
  onBack,
  onRemove,
  onSave,
}: {
  promiseName: string;
  watcher: Pick<Watcher, 'name' | 'scope' | 'connectedAt'>;
  onBack: () => void;
  onRemove: () => void;
  onSave: (scope: WatcherScope) => void;
}) {
  const [scope, setScope] = useState<WatcherScope>(watcher.scope);
  return (
    <Screen
      scroll
      footer={
        <BottomActions caption={`바꾼 설정은 ${watcher.name}님에게도 알려드려요`}>
          <Button label="저장" onPress={() => onSave(scope)} />
        </BottomActions>
      }
    >
      <Header onBack={onBack} title="감시자" />
      <WatcherIntro name={promiseName} />
      <ScopePicker value={scope} onChange={setScope} />
      <View style={{ gap: 10 }}>
        <SectionLabel>감시자</SectionLabel>
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
            <Avatar name={watcher.name} />
            <View style={{ flexShrink: 1 }}>
              <Text size={15} weight="semibold" numberOfLines={1}>
                {watcher.name}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {/* 와이어프레임의 초록 점 → 켜진 LED (SPEC 5.1) */}
                <Led state="glow" size={6} />
                <Text size={12} color="text3">
                  {watcher.connectedAt ? `연결됨, ${dayLabel(watcher.connectedAt)}부터` : '연결됨'}
                </Text>
              </View>
            </View>
          </View>
          <PillButton label="해제" onPress={onRemove} />
        </View>
      </View>
    </Screen>
  );
}

export default function WatcherConnectedRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = useStore((s) => s.promises[id]);
  const removeWatcher = useStore((s) => s.removeWatcher);
  // 해제 직후 화면이 닫히기 전까지 마지막 감시자를 그대로 보여준다
  const last = useRef<Watcher | undefined>(undefined);
  if (p?.watcher) last.current = p.watcher;
  const w = last.current;
  if (!p || !w) return null;
  return (
    <WatcherConnectedView
      promiseName={promiseTitle(p)}
      watcher={w}
      onBack={() => router.back()}
      onRemove={() => {
        removeWatcher(id);
        router.back();
      }}
      onSave={(scope) => {
        if (scope !== w.scope) useStore.getState().updateWatcherScope(id, scope);
        router.back();
      }}
    />
  );
}
