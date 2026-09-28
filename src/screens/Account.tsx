/** 46. 계정: 홈 우상단에서 */
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  BottomSheet,
  Button,
  Header,
  Icon,
  ListCard,
  PillButton,
  ProBadge,
  Screen,
  SettingRow,
  Text,
  TextButton,
} from '../components';
import { DAY, dayLabel } from '../domain/rules';
import type { NotificationSettings, ProState, User } from '../domain/types';
import { href } from '../lib/routes';
import { goHome, go, replace } from '../lib/nav';
import { useNow, useStore } from '../store';
import { cardLabel } from '../store/selectors';
import { colors } from '../theme';

export type AccountModel = {
  name: string;
  provider: User['provider'];
  pro: ProState;
  hasCard: boolean;
  cardLabel: string;
  notifSummary: string;
};

/** 알림 줄 오른쪽 요약: "시작 10분 전, 마감 5분 전" */
export function notifSummary(s: NotificationSettings) {
  const parts: string[] = [];
  if (s.beforeOpen) parts.push(`시작 ${s.beforeOpenMinutes}분 전`);
  if (s.deadline) parts.push(`마감 ${s.deadlineMinutes}분 전`);
  return parts.length ? parts.join(', ') : '판정·결제 알림만';
}

/** 프로 카드 문구 */
export function proCardCopy(pro: ProState, now: number): { top: string; body: string } {
  if (pro.status === 'trial' && pro.trialEndsAt) {
    const left = Math.max(0, Math.ceil((pro.trialEndsAt - now) / DAY));
    return { top: `체험 중 D-${left}`, body: `${dayLabel(pro.trialEndsAt)}에 체험이 끝나요` };
  }
  if (pro.status === 'pro')
    return { top: '사용 중', body: pro.renewsAt ? `다음 결제일 ${dayLabel(pro.renewsAt)}` : '프로를 쓰고 있어요' };
  return {
    top: '',
    body: pro.startedAt ? '월 4,900원, 쉬어가기 4번, 자동 인증' : '7일 무료, 쉬어가기 4번, 자동 인증',
  };
}

export function AccountView({
  model,
  now,
  onBack,
  onNavigate,
  onLogout,
}: {
  model: AccountModel;
  now: number;
  onBack: () => void;
  onNavigate: (to: string) => void;
  onLogout: () => void;
}) {
  const [confirmLogout, setConfirmLogout] = useState(false);
  const pro = proCardCopy(model.pro, now);

  return (
    <Screen
      scroll
      overlay={
        <BottomSheet
          visible={confirmLogout}
          onClose={() => setConfirmLogout(false)}
          title="로그아웃할까요?"
          footer={
            <>
              <Button
                label="로그아웃"
                onPress={() => {
                  setConfirmLogout(false);
                  onLogout();
                }}
              />
              <TextButton label="취소" onPress={() => setConfirmLogout(false)} />
            </>
          }
        >
          <Text size={15} color="text2" body>
            로그아웃해도 진행 중인 약속은 그대로예요. 인증하지 못한 날에는 등록된 카드로 결제돼요.
          </Text>
        </BottomSheet>
      }
    >
      <Header onBack={onBack} title="계정" />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 4, paddingHorizontal: 4, paddingBottom: 6 }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: colors.ink,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="user" size={24} color={colors.signal} />
        </View>
        <View style={{ flex: 1 }}>
          <Text size={17} weight="bold" numberOfLines={1}>
            {model.name}
          </Text>
          <Text size={13} color="text2">
            {model.provider === 'kakao' ? '카카오로 로그인' : '애플로 로그인'}
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => onNavigate(href.pro)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 20,
          borderRadius: 22,
          backgroundColor: colors.ink,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <View style={{ gap: 4, flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ProBadge />
            {pro.top ? (
              <Text size={13} weight="semibold" color="signal">
                {pro.top}
              </Text>
            ) : null}
          </View>
          <Text size={16} weight="semibold" color="surface">
            {pro.body}
          </Text>
        </View>
        <Icon name="chevronRight" size={20} color={colors.textOnInk} />
      </Pressable>

      <ListCard title="결제">
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: 60,
            gap: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.lineOnSurface,
          }}
        >
          <View style={{ gap: 2, flex: 1 }}>
            <Text size={15}>결제 카드</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="card" size={16} color={colors.text2} />
              <Text size={13} color="text2" numberOfLines={1}>
                {model.cardLabel}
              </Text>
            </View>
          </View>
          <PillButton label={model.hasCard ? '변경' : '등록'} onPress={() => onNavigate(href.pg('change'))} />
        </View>
        <SettingRow label="결제 내역" onPress={() => onNavigate(href.payments)} last />
      </ListCard>

      <ListCard>
        <SettingRow label="알림" value={model.notifSummary} onPress={() => onNavigate(href.notifications)} />
        <SettingRow label="약관과 문의" onPress={() => onNavigate(href.support)} last />
      </ListCard>

      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
        <LinkButton label="로그아웃" onPress={() => setConfirmLogout(true)} />
        <Text size={15} color="border">
          |
        </Text>
        <LinkButton label="회원 탈퇴" onPress={() => onNavigate(href.withdraw)} />
      </View>

      <View style={{ marginTop: 12 }}>
        <ListCard title="개발용">
          <SettingRow label="개발 메뉴" description="시간 이동, 판정·결제 결과 정하기" onPress={() => onNavigate(href.dev)} />
          <SettingRow label="화면 갤러리" description="모든 화면을 예시 데이터로 보기" onPress={() => onNavigate(href.gallery)} last />
        </ListCard>
      </View>
    </Screen>
  );
}

function LinkButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ height: 48, paddingHorizontal: 8, justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
    >
      <Text size={15} color="text2">
        {label}
      </Text>
    </Pressable>
  );
}

/** 바로 들어온 경우(알림·개발용 주소) 뒤로 갈 곳이 없으면 홈으로 */
const back = () => (router.canGoBack() ? router.back() : goHome());

export default function AccountRoute() {
  const now = useNow();
  const d = useStore();
  const model: AccountModel = {
    name: d.user?.name ?? '',
    provider: d.user?.provider ?? 'kakao',
    pro: d.user?.pro ?? { status: 'free' },
    hasCard: !!d.card,
    cardLabel: cardLabel(d),
    notifSummary: notifSummary(d.settings),
  };
  return (
    <AccountView
      model={model}
      now={now}
      onBack={back}
      onNavigate={go}
      onLogout={() => {
        useStore.getState().logout();
        if (router.canDismiss()) router.dismissAll();
        replace(href.welcome);
      }}
    />
  );
}
