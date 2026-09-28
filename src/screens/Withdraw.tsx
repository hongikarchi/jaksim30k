/** 49. 회원 탈퇴: 계정에서 (SPEC 2.6) */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import {
  BottomActions,
  Button,
  CheckRow,
  Header,
  InfoCard,
  KeyValueRow,
  Screen,
  Text,
  TextButton,
  Title,
} from '../components';
import { won } from '../domain/rules';
import { goHome, replace } from '../lib/nav';
import { href } from '../lib/routes';
import { useStore } from '../store';
import type { Data } from '../store';
import { activePromises } from '../store/selectors';
import { colors, radius } from '../theme';

export type WithdrawModel = {
  activeCount: number;
  /** 결제 예정(scheduled): 탈퇴와 함께 먼저 결제 */
  scheduledAmount: number;
  /** 이의제기 중이라 보류된 건(held): 결과 후 처리 */
  heldCount: number;
};

export function buildWithdrawModel(d: Data): WithdrawModel {
  const charges = Object.values(d.charges);
  return {
    activeCount: activePromises(d).length,
    scheduledAmount: charges.filter((c) => c.status === 'scheduled').reduce((a, c) => a + c.amount, 0),
    heldCount: charges.filter((c) => c.status === 'held').length,
  };
}

export function WithdrawView({
  model,
  initialChecked = false,
  onBack,
  onWithdraw,
}: {
  model: WithdrawModel;
  initialChecked?: boolean;
  onBack: () => void;
  onWithdraw: () => void;
}) {
  const [checked, setChecked] = useState(initialChecked);
  const m = model;
  return (
    <Screen
      footer={
        <View style={{ gap: 8 }}>
          <TextButton label="계속 쓸게요" onPress={onBack} />
          <BottomActions>
            <Button label="탈퇴하기" disabled={!checked} onPress={onWithdraw} />
          </BottomActions>
        </View>
      }
    >
      <Header onBack={onBack} />
      <View style={{ paddingHorizontal: 4 }}>
        <Title>{'탈퇴하기 전에\n확인해 주세요'}</Title>
      </View>

      <View style={{ paddingVertical: 4, paddingHorizontal: 20, borderRadius: radius.card, backgroundColor: colors.surface }}>
        <KeyValueRow label="진행 중인 약속" value={m.activeCount ? `${m.activeCount}개, 바로 끝나요` : '없어요'} />
        <KeyValueRow label="결제 예정 금액" value={m.scheduledAmount ? `${won(m.scheduledAmount)} 먼저 결제` : '없어요'} />
        {m.heldCount ? <KeyValueRow label="이의제기 중인 건" value={`${m.heldCount}건, 결과 후 처리`} /> : null}
        <KeyValueRow label="기록과 결제 내역" value="보관 기간 뒤 삭제" last />
      </View>

      <InfoCard icon="info">
        결제 예정 금액이 있으면 탈퇴와 함께 등록된 카드로 결제돼요. 이의제기 중인 건은 결과가 나온 뒤 처리돼요.
      </InfoCard>

      <View style={{ minHeight: 52, justifyContent: 'center', paddingHorizontal: 16, borderRadius: radius.button, backgroundColor: colors.surface }}>
        <CheckRow checked={checked} onPress={() => setChecked(!checked)}>
          <Text size={15} weight="semibold">
            위 내용을 확인했어요
          </Text>
        </CheckRow>
      </View>
    </Screen>
  );
}

/** 바로 들어온 경우(알림·개발용 주소) 뒤로 갈 곳이 없으면 홈으로 */
const back = () => (router.canGoBack() ? router.back() : goHome());

export default function WithdrawRoute() {
  const d = useStore();
  return (
    <WithdrawView
      model={buildWithdrawModel(d)}
      onBack={back}
      onWithdraw={() => {
        useStore.getState().withdraw();
        if (router.canDismiss()) router.dismissAll();
        replace(href.welcome);
      }}
    />
  );
}
