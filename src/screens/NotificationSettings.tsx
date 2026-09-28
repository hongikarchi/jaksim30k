/** 47. 알림 설정: 계정에서. 돈·판정 알림은 끌 수 없다 (SPEC 6) */
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Header, Icon, Screen, Segmented, Text, Toggle } from '../components';
import type { NotificationSettings } from '../domain/types';
import { requestNotificationPermission } from '../lib/notifications';
import { useStore } from '../store';
import { colors, radius } from '../theme';
import { goHome } from '../lib/nav';

const MINUTES: NotificationSettings['beforeOpenMinutes'][] = [5, 10, 30];

export function NotificationSettingsView({
  settings,
  permission,
  permissionDenied,
  onBack,
  onChange,
  onRequestPermission,
}: {
  settings: NotificationSettings;
  /** 기기 알림 권한 */
  permission: boolean;
  /** 권한을 요청했는데 거절됨 */
  permissionDenied?: boolean;
  onBack: () => void;
  onChange: (patch: Partial<NotificationSettings>) => void;
  onRequestPermission: () => void;
}) {
  const s = settings;
  return (
    <Screen scroll>
      <Header onBack={onBack} title="알림" />
      <Text size={13} color="text2" body style={{ paddingHorizontal: 4 }}>
        모든 약속에 똑같이 적용돼요. 시간은 각 약속의 인증 시간 기준이에요.
      </Text>

      {!permission ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, borderRadius: radius.card, backgroundColor: colors.ink }}>
          <Icon name="bell" size={22} color={colors.signal} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text size={15} weight="semibold" color="surface">
              기기 알림이 꺼져 있어요
            </Text>
            <Text size={12} color="textOnInk" body>
              {permissionDenied ? '기기 설정에서 작심삼만원 알림을 켜주세요' : '꺼져 있으면 인증 창이 열려도 알려드릴 수 없어요'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={onRequestPermission}
            hitSlop={6}
            style={({ pressed }) => ({
              height: 32,
              paddingHorizontal: 14,
              borderRadius: radius.pill,
              backgroundColor: colors.surface,
              justifyContent: 'center',
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text size={13} weight="semibold">
              켜기
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Group>
        <ToggleRow
          label="인증 시작 전 알림"
          description="인증 창이 열리기 전에 깨워드려요"
          on={s.beforeOpen}
          onToggle={() => onChange({ beforeOpen: !s.beforeOpen })}
        />
        {s.beforeOpen ? (
          <Minutes value={s.beforeOpenMinutes} onChange={(v) => onChange({ beforeOpenMinutes: v })} />
        ) : null}
        <Divider />
        <ToggleRow
          label="인증 창 열림 알림"
          description="짧은 인증 창이 열리는 순간 알려드려요"
          on={s.open}
          onToggle={() => onChange({ open: !s.open })}
        />
      </Group>

      <Group>
        <ToggleRow
          label="마감 임박 알림"
          description="아직 인증하지 않았을 때만 보내요"
          on={s.deadline}
          onToggle={() => onChange({ deadline: !s.deadline })}
        />
        {s.deadline ? <Minutes value={s.deadlineMinutes} onChange={(v) => onChange({ deadlineMinutes: v })} /> : null}
        <Divider />
        <ToggleRow
          label="넓은 창 마감 3시간 전"
          description="하루 종일 열린 약속을 잊지 않게 알려드려요"
          on={s.wideDeadline}
          onToggle={() => onChange({ wideDeadline: !s.wideDeadline })}
        />
      </Group>

      <Group>
        <ToggleRow
          label="쉬어가는 날 알림"
          description="쉬어가는 날 아침에 알려드려요"
          on={s.pauseDay}
          onToggle={() => onChange({ pauseDay: !s.pauseDay })}
        />
        <Divider />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, minHeight: 64 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text size={15} weight="semibold">
              판정·결제 알림
            </Text>
            <Text size={12} color="text3">
              돈과 관련된 알림이라 끌 수 없어요
            </Text>
          </View>
          <FixedOn />
        </View>
        <Divider />
        <ToggleRow
          label="혜택과 소식"
          description="새 기능과 이벤트 안내"
          on={s.marketing}
          onToggle={() => onChange({ marketing: !s.marketing })}
        />
      </Group>
    </Screen>
  );
}

function Group({ children }: { children: ReactNode }) {
  return <View style={{ paddingVertical: 4, paddingHorizontal: 20, borderRadius: radius.card, backgroundColor: colors.surface }}>{children}</View>;
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.lineOnSurface }} />;
}

function ToggleRow({
  label,
  description,
  on,
  onToggle,
}: {
  label: string;
  description: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      onPress={onToggle}
      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, minHeight: 64 }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text size={15} weight="semibold">
          {label}
        </Text>
        <Text size={12} color="text3">
          {description}
        </Text>
      </View>
      <Toggle on={on} onPress={onToggle} />
    </Pressable>
  );
}

function Minutes({
  value,
  onChange,
}: {
  value: NotificationSettings['beforeOpenMinutes'];
  onChange: (v: NotificationSettings['beforeOpenMinutes']) => void;
}) {
  return (
    <View style={{ paddingBottom: 16 }}>
      <Segmented options={MINUTES} value={value} onChange={onChange} format={(m) => `${m}분 전`} />
    </View>
  );
}

/** 끌 수 없는 스위치: 켜진 모양 그대로 흐리게 (와이어프레임 #5E5E59 / #9A9A94 → text2 / textOnInk) */
function FixedOn() {
  return (
    <View
      accessibilityRole="switch"
      accessibilityState={{ checked: true, disabled: true }}
      style={{ width: 50, height: 30, borderRadius: 15, padding: 3, backgroundColor: colors.text2, alignItems: 'flex-end' }}
    >
      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.textOnInk }} />
    </View>
  );
}

/** 바로 들어온 경우(알림·개발용 주소) 뒤로 갈 곳이 없으면 홈으로 */
const back = () => (router.canGoBack() ? router.back() : goHome());

export default function NotificationSettingsRoute() {
  const settings = useStore((s) => s.settings);
  const permission = useStore((s) => s.user?.permissions.notifications ?? false);
  const [denied, setDenied] = useState(false);
  return (
    <NotificationSettingsView
      settings={settings}
      permission={permission}
      permissionDenied={denied}
      onBack={back}
      onChange={(patch) => useStore.getState().updateSettings(patch)}
      onRequestPermission={async () => {
        const ok = await requestNotificationPermission();
        if (ok) useStore.getState().grantPermissions({ notifications: true });
        else setDenied(true);
      }}
    />
  );
}
