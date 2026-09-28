/** 51. 프로 구독: 계정, 프로 잠금 안내에서. 구독은 스토어 인앱결제 (SPEC 3) */
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  BottomActions,
  BottomSheet,
  Button,
  DotText,
  Header,
  Icon,
  KeyValueRow,
  Radio,
  Screen,
  Tag,
  Text,
  TextButton,
} from '../components';
import { DAY, dayLabel } from '../domain/rules';
import type { ProState } from '../domain/types';
import { useNow, useStore } from '../store';
import { colors, radius } from '../theme';
import { PRO_FEATURES } from './ProLockSheet';
import { goHome } from '../lib/nav';

type Plan = 'month' | 'year';

const PLANS: Record<Plan, { label: string; price: string; unit: string; note?: string }> = {
  month: { label: '월간', price: '4,900원', unit: '/월' },
  year: { label: '연간', price: '39,000원', unit: '/년', note: '월 3,250원' },
};

const TEST_NOTE = '테스트 빌드라 실제로 결제되지 않아요.';

export function ProView({
  pro,
  now,
  onBack,
  onStart,
  onCancel,
}: {
  pro: ProState;
  now: number;
  onBack: () => void;
  onStart: (plan: Plan) => void;
  onCancel: () => void;
}) {
  const [plan, setPlan] = useState<Plan>(pro.plan ?? 'year');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const active = pro.status !== 'free';
  const canTrial = !pro.startedAt;

  let footer;
  if (active) {
    const trial = pro.status === 'trial';
    footer = (
      <BottomActions
        caption={
          trial
            ? `체험이 끝나면 ${PLANS[pro.plan ?? 'month'].price}이 결제돼요. ${TEST_NOTE}`
            : `구독은 스토어에서 관리돼요. ${TEST_NOTE}`
        }
      >
        <Button label="확인" onPress={onBack} />
        <TextButton label="구독 해지" onPress={() => setConfirmCancel(true)} />
      </BottomActions>
    );
  } else {
    footer = (
      <BottomActions
        caption={canTrial ? `체험이 끝나기 하루 전에 알려드려요. 언제든 해지할 수 있어요.\n${TEST_NOTE}` : TEST_NOTE}
      >
        <Button
          label={canTrial ? '7일 무료로 시작하기' : `${plan === 'year' ? '연 39,000원' : '월 4,900원'}으로 시작하기`}
          onPress={() => onStart(plan)}
        />
      </BottomActions>
    );
  }

  return (
    <Screen
      scroll
      footer={footer}
      overlay={
        <BottomSheet
          visible={confirmCancel}
          onClose={() => setConfirmCancel(false)}
          title="구독을 해지할까요?"
          footer={
            <>
              <Button
                label="해지하기"
                onPress={() => {
                  setConfirmCancel(false);
                  onCancel();
                }}
              />
              <TextButton label="계속 쓸게요" onPress={() => setConfirmCancel(false)} />
            </>
          }
        >
          <Text size={15} color="text2" body>
            해지하면 러닝 자동 인증, 헬스장 위치 자동 인증, 감시자 지정을 쓸 수 없고 쉬어가기는 한 달 1번으로 돌아가요.
          </Text>
        </BottomSheet>
      }
    >
      <Header onBack={onBack} />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
          paddingVertical: 16,
          paddingHorizontal: 20,
          borderRadius: 24,
          backgroundColor: colors.ink,
        }}
      >
        <View style={{ gap: 6, flex: 1 }}>
          <DotText size={40} color="signal">
            PRO
          </DotText>
          <Text size={17} weight="bold" color="surface" tight style={{ lineHeight: 23 }}>
            {'인증은 더 간단하게,\n약속은 더 단단하게'}
          </Text>
        </View>
        {active ? (
          <Tag label={pro.status === 'trial' ? '체험 중' : '사용 중'} />
        ) : canTrial ? (
          <Tag label="7일 무료" />
        ) : null}
      </View>

      {active ? (
        <StatusCard pro={pro} now={now} />
      ) : (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {(['month', 'year'] as Plan[]).map((k) => (
            <PlanCard key={k} plan={k} selected={plan === k} onPress={() => setPlan(k)} />
          ))}
        </View>
      )}

      <CompareTable />
    </Screen>
  );
}

function StatusCard({ pro, now }: { pro: ProState; now: number }) {
  const p = PLANS[pro.plan ?? 'month'];
  const trial = pro.status === 'trial';
  const left = pro.trialEndsAt ? Math.max(0, Math.ceil((pro.trialEndsAt - now) / DAY)) : 0;
  return (
    <View style={{ paddingVertical: 4, paddingHorizontal: 20, borderRadius: radius.card, backgroundColor: colors.surface }}>
      <KeyValueRow label="상태" value={trial ? `무료 체험 중, ${left}일 남음` : '프로 구독 중'} />
      <KeyValueRow label="요금제" value={`${p.label} ${p.price}`} />
      {trial && pro.trialEndsAt ? (
        <KeyValueRow label="체험 종료일" value={dayLabel(pro.trialEndsAt)} last />
      ) : (
        <KeyValueRow label="다음 결제일" value={pro.renewsAt ? dayLabel(pro.renewsAt) : '-'} last />
      )}
    </View>
  );
}

function PlanCard({ plan, selected, onPress }: { plan: Plan; selected: boolean; onPress: () => void }) {
  const p = PLANS[plan];
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={{
        flex: 1,
        gap: 6,
        minHeight: 84,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 16,
        backgroundColor: colors.surface,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? colors.ink : colors.border,
        alignItems: 'flex-start',
      }}
    >
      <Radio selected={selected} />
      <Text size={13} weight="semibold" color="text2">
        {p.label}
      </Text>
      <Text size={20} weight="bold" tight>
        {p.price}
        <Text size={13} weight="medium" color="text3">
          {p.unit}
        </Text>
      </Text>
      {p.note ? <Tag label={p.note} /> : null}
    </Pressable>
  );
}

function CompareTable() {
  const rows: { label: string; free: string; pro: string | null }[] = [
    { label: '쉬어가기', free: '월 1번', pro: '월 4번' },
    ...PRO_FEATURES.filter((f) => !f.startsWith('쉬어가기')).map((f) => ({ label: f, free: '—', pro: null })),
  ];
  return (
    <View style={{ paddingVertical: 4, paddingHorizontal: 18, borderRadius: 20, backgroundColor: colors.surface }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 30, borderBottomWidth: 1, borderBottomColor: colors.lineOnSurface }}>
        <View style={{ flex: 1 }} />
        <Text size={12} color="text3" align="center" style={{ width: 60 }}>
          무료
        </Text>
        <Text size={12} weight="bold" align="center" style={{ width: 60 }}>
          프로
        </Text>
      </View>
      {rows.map((r, i) => (
        <View
          key={r.label}
          style={[
            { flexDirection: 'row', alignItems: 'center', minHeight: 38 },
            i < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.lineOnSurface },
          ]}
        >
          <Text size={15} style={{ flex: 1 }}>
            {r.label}
          </Text>
          <Text size={13} color="text3" align="center" style={{ width: 60 }}>
            {r.free}
          </Text>
          <View style={{ width: 60, alignItems: 'center' }}>
            {r.pro ? (
              <Text size={13} weight="bold">
                {r.pro}
              </Text>
            ) : (
              <Icon name="check" size={18} strokeWidth={2.5} />
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const FREE: ProState = { status: 'free' };

/** 바로 들어온 경우(알림·개발용 주소) 뒤로 갈 곳이 없으면 홈으로 */
const back = () => (router.canGoBack() ? router.back() : goHome());

export default function ProRoute() {
  const now = useNow(60_000);
  const pro = useStore((s) => s.user?.pro) ?? FREE;
  return (
    <ProView
      pro={pro}
      now={now}
      onBack={back}
      onStart={(plan) => {
        useStore.getState().startPro(plan);
        back();
      }}
      onCancel={() => useStore.getState().cancelPro()}
    />
  );
}
