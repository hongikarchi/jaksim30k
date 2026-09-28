/** 42. 감시자 지정 (프로): 알릴 범위 + 이름 → 카카오톡 초대 */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import {
  BottomActions,
  Button,
  Field,
  Header,
  OptionCard,
  ProBadge,
  Screen,
  SectionLabel,
  Text,
} from '../components';
import type { Watcher } from '../domain/types';
import { href } from '../lib/routes';
import { replace } from '../lib/nav';
import { colors } from '../theme';
import { useStore } from '../store';
import { promiseTitle } from '../store/selectors';

export type WatcherScope = Watcher['scope'];

export const SCOPE_OPTIONS: { value: WatcherScope; label: string; description: string }[] = [
  { value: 'missed', label: '놓친 날만', description: '약속을 어겼을 때만 알려요' },
  { value: 'daily', label: '매일 결과', description: '지킨 날도 함께 알려요' },
];

/** 감시자 화면 위쪽 검정 안내 카드 (42·44 공통) */
export function WatcherIntro({ name }: { name: string }) {
  return (
    <View style={{ gap: 14, padding: 22, borderRadius: 24, backgroundColor: colors.ink }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text size={13} weight="semibold" color="textOnInk">
          {name}
        </Text>
        <ProBadge />
      </View>
      <Text size={20} weight="bold" color="surface" tight style={{ lineHeight: 27 }}>
        놓치면 누군가 알게 돼요
      </Text>
      <Text size={14} color="textOnInk" body>
        지정한 사람에게 카카오톡으로 결과가 가요. 돈 말고 체면도 걸어보세요.
      </Text>
    </View>
  );
}

/** 알릴 범위 고르기 (42·44 공통) */
export function ScopePicker({ value, onChange }: { value: WatcherScope; onChange: (v: WatcherScope) => void }) {
  return (
    <View style={{ gap: 10 }}>
      <SectionLabel>무엇을 알려줄까요?</SectionLabel>
      {SCOPE_OPTIONS.map((o) => (
        <OptionCard
          key={o.value}
          selected={value === o.value}
          onPress={() => onChange(o.value)}
          label={o.label}
          description={o.description}
        />
      ))}
    </View>
  );
}

export function WatcherSetupView({
  promiseName,
  initialName = '',
  initialScope = 'missed',
  onBack,
  onInvite,
}: {
  promiseName: string;
  initialName?: string;
  initialScope?: WatcherScope;
  onBack: () => void;
  onInvite: (w: { name: string; scope: WatcherScope }) => void;
}) {
  const [scope, setScope] = useState<WatcherScope>(initialScope);
  const [name, setName] = useState(initialName);
  const trimmed = name.trim();
  return (
    <Screen
      scroll
      footer={
        <BottomActions caption="감시자는 앱이 없어도 카카오톡으로 받아볼 수 있어요">
          <Button
            variant="kakao"
            label="카카오톡으로 초대하기"
            disabled={!trimmed}
            onPress={() => onInvite({ name: trimmed, scope })}
          />
        </BottomActions>
      }
    >
      <Header onBack={onBack} title="감시자" />
      <WatcherIntro name={promiseName} />
      <ScopePicker value={scope} onChange={setScope} />
      <View style={{ gap: 10 }}>
        <SectionLabel>감시자</SectionLabel>
        <Field
          value={name}
          onChangeText={setName}
          placeholder="이름 (예: 김지수)"
          maxLength={12}
          returnKeyType="done"
          accessibilityLabel="감시자 이름"
        />
        <Text size={12} color="text3" style={{ paddingHorizontal: 4 }}>
          초대를 수락하면 연결돼요
        </Text>
      </View>
    </Screen>
  );
}

export default function WatcherSetupRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = useStore((s) => s.promises[id]);
  const setWatcher = useStore((s) => s.setWatcher);
  if (!p) return null;
  return (
    <WatcherSetupView
      promiseName={promiseTitle(p)}
      initialName={p.watcher?.name}
      initialScope={p.watcher?.scope}
      onBack={() => router.back()}
      onInvite={(w) => {
        // 가짜: 실제 카카오톡 공유 없이 초대만 기록한다
        setWatcher(id, w);
        replace(href.watcherMessage(id));
      }}
    />
  );
}
