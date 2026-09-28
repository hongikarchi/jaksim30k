/** 놓친 날·이의제기·결제 실패 화면(25~39)이 함께 쓰는 작은 조각 */
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { BottomActions, Button, Icon, Screen, Text, Title, type IconName } from '../components';
import { dateKey } from '../domain/rules';
import type { ChargeStatus, DisputeReason, Dispute } from '../domain/types';
import { goHome } from '../lib/nav';
import { colors } from '../theme';

/** 주소 파라미터 → 문자열 (인코딩이 남아 있으면 풀어준다) */
export function paramOf(v: string | string[] | undefined) {
  const s = Array.isArray(v) ? v[0] : v;
  if (!s) return '';
  try {
    return s.includes('%') ? decodeURIComponent(s) : s;
  } catch {
    return s;
  }
}

/** "오늘" / "어제" / "내일" / "9월 28일" */
export function dayWord(t: number, now: number) {
  const d = new Date(t);
  const n = new Date(now);
  if (dateKey(d) === dateKey(n)) return '오늘';
  const y = new Date(n.getFullYear(), n.getMonth(), n.getDate() - 1);
  if (dateKey(d) === dateKey(y)) return '어제';
  const tm = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1);
  if (dateKey(d) === dateKey(tm)) return '내일';
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** 은/는 */
export const eunNeun = (w: string) => {
  const c = w.charCodeAt(w.length - 1) - 0xac00;
  return c >= 0 && c <= 11171 && c % 28 > 0 ? '은' : '는';
};

/** 이의제기 사유 (SPEC 2.4) */
export const DISPUTE_REASONS: { id: DisputeReason; label: string; short: string }[] = [
  { id: 'app_error', label: '앱이나 카메라 오류가 있었어요', short: '앱이나 카메라 오류' },
  { id: 'wrong_fail', label: '인증했는데 실패로 처리됐어요', short: '인증했는데 실패 처리됨' },
  { id: 'sick', label: '몸이 아팠어요', short: '몸이 아팠음' },
  { id: 'other', label: '기타', short: '기타' },
];
export const reasonShort = (r: DisputeReason) => DISPUTE_REASONS.find((x) => x.id === r)?.short ?? '기타';

export type OutcomeCharge = {
  amount: number;
  scheduledAt: number;
  status: ChargeStatus;
  paidAt?: number;
};
export type OutcomeDispute = Pick<Dispute, 'id' | 'status' | 'dueAt'>;

/** 뒤로 갈 곳이 없으면(알림으로 바로 들어온 경우) 홈으로 */
export function backOrHome() {
  if (router.canGoBack()) router.back();
  else goHome();
}

/** 결과 화면 위 56 동그라미 아이콘 */
export function IconCircle({ tone, icon }: { tone: 'ink' | 'signal'; icon: IconName }) {
  return (
    <View
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tone === 'ink' ? colors.ink : colors.signal,
      }}
    >
      <Icon name={icon} size={26} strokeWidth={2.5} color={tone === 'ink' ? colors.surface : colors.ink} />
    </View>
  );
}

/** 회색 바탕 위 표 (위쪽 구분선 + 줄마다 아래 구분선) */
export function GroundRows({ children }: { children: ReactNode }) {
  return <View style={{ borderTopWidth: 1, borderTopColor: colors.lineOnGround }}>{children}</View>;
}

/** 회색 바탕 위 표의 금액 줄 (22px) */
export function AmountRow({ label, amount, strike }: { label: string; amount: string; strike?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnGround,
      }}
    >
      <Text size={15} color="text3">
        {label}
      </Text>
      <Text
        size={22}
        weight="bold"
        color={strike ? 'text3' : 'ink'}
        style={strike ? { textDecorationLine: 'line-through' } : undefined}
      >
        {amount}
      </Text>
    </View>
  );
}

/** 흰 카드 표 (좌우 20, 위아래 padY) */
export function WhiteRows({ children, padY = 4 }: { children: ReactNode; padY?: number }) {
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 22, paddingHorizontal: 20, paddingVertical: padY }}>
      {children}
    </View>
  );
}

/** 진행 막대 (머문 시간) */
export function ProgressBar({ ratio }: { ratio: number }) {
  const r = Math.max(0, Math.min(1, ratio));
  return (
    <View style={{ height: 10, borderRadius: 5, backgroundColor: colors.fill, overflow: 'hidden' }}>
      <View style={{ width: `${r * 100}%`, height: 10, borderRadius: 5, backgroundColor: colors.signal }} />
    </View>
  );
}

/** 주소의 약속·기록을 찾지 못했을 때 */
export function NotFound({ onHome }: { onHome: () => void }) {
  return (
    <Screen
      topGap="wide"
      wide
      footer={
        <BottomActions>
          <Button label="홈으로" onPress={onHome} />
        </BottomActions>
      }
    >
      <Title sub="이미 지난 기록이거나 끝낸 약속이에요.">기록을 찾을 수 없어요</Title>
    </Screen>
  );
}
