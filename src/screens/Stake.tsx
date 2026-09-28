/** 11. 금액 정하기: 한 번에 낼 최대 금액 */
import { router } from 'expo-router';
import { View } from 'react-native';

import { AmountStepper, BottomActions, Button, Header, InfoCard, Screen, SectionLabel, StakeBars, Title } from '../components';
import { href } from '../lib/routes';
import { go, replace } from '../lib/nav';
import { useStore } from '../store';

export function StakeView({
  maxAmount,
  onChange,
  onBack,
  onNext,
}: {
  maxAmount: number;
  onChange: (v: number) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <Screen
      wide
      gap={12}
      footer={
        <BottomActions>
          <Button label="다음" onPress={onNext} />
        </BottomActions>
      }
    >
      <Header onBack={onBack} step="2 / 3" />
      <Title sub="어길 때마다 다음 금액으로 올라가요.">{'약속을 어기면\n얼마를 낼까요?'}</Title>
      <StakeBars max={maxAmount} />
      <View style={{ gap: 10 }}>
        <SectionLabel>한 번에 낼 최대 금액</SectionLabel>
        <AmountStepper value={maxAmount} onChange={onChange} />
      </View>
      <InfoCard icon="info" muted>
        금액은 언제든 바로 바꿀 수 있어요.
      </InfoCard>
    </Screen>
  );
}

/**
 * 만들던 약속(초안)이 없을 때. 약속을 시작한 직후 스택 아래 화면이 다시 그려질 수 있어서
 * 자동으로 이동하지 않고 안내만 한다.
 */
export function NoDraftView({ onBack, onGoal }: { onBack: () => void; onGoal: () => void }) {
  return (
    <Screen
      wide
      footer={
        <BottomActions>
          <Button label="새 약속 만들기" onPress={onGoal} />
        </BottomActions>
      }
    >
      <Header onBack={onBack} />
      <Title sub="약속 고르기부터 다시 시작해 주세요.">만들던 약속이 없어요</Title>
    </Screen>
  );
}

export default function StakeRoute() {
  const draft = useStore((s) => s.draft);
  const updateDraft = useStore((s) => s.updateDraft);
  if (!draft) return <NoDraftView onBack={() => router.back()} onGoal={() => replace(href.goal)} />;
  return (
    <StakeView
      maxAmount={draft.maxAmount}
      onChange={(maxAmount) => updateDraft({ maxAmount })}
      onBack={() => router.back()}
      onNext={() => go(href.confirm)}
    />
  );
}
