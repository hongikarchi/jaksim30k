/** 14. 카드 등록 실패: PG 창에서 실패하거나 닫았을 때 */
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { BottomActions, Button, Icon, InfoCard, KeyValueRow, Screen, TextButton, Title } from '../components';
import { KIND_NAMES, scheduleSummary } from '../domain/rules';
import { goHome, replace } from '../lib/nav';
import { href } from '../lib/routes';
import { useStore } from '../store';
import { colors } from '../theme';
import { stakeRange } from './Confirm';

export type CardFailedSummary = { name: string; schedule: string; stake: string };

export function CardFailedView({
  purpose,
  summary,
  onRetry,
  onLater,
}: {
  purpose: 'create' | 'change';
  /** 만들던 약속 (약속 만들기에서 왔을 때) */
  summary?: CardFailedSummary | null;
  onRetry: () => void;
  onLater: () => void;
}) {
  return (
    <Screen
      wide
      topGap="wide"
      gap={24}
      footer={
        <BottomActions>
          <TextButton label="나중에 할게요" onPress={onLater} />
          <Button label="다시 등록하기" onPress={onRetry} />
        </BottomActions>
      }
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.signal,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="cardFailed" size={26} strokeWidth={2.5} />
      </View>
      <Title sub="카드 정보를 확인하거나 다른 카드로 다시 시도해 주세요.">카드 등록이 안 됐어요</Title>
      {summary ? (
        <View style={{ borderTopWidth: 1, borderTopColor: colors.lineOnGround }}>
          <KeyValueRow onGround label="약속" value={summary.name} />
          <KeyValueRow onGround label="인증 시간" value={summary.schedule} />
          <KeyValueRow onGround label="약속 금액" value={summary.stake} />
        </View>
      ) : null}
      <InfoCard>
        {purpose === 'create'
          ? '설정한 약속은 저장해 뒀어요. 카드만 등록하면 바로 시작돼요.'
          : '지금 등록된 카드는 그대로예요. 다른 카드로 다시 시도해 주세요.'}
      </InfoCard>
    </Screen>
  );
}

export default function CardFailedRoute() {
  const { purpose: p } = useLocalSearchParams<{ purpose?: string }>();
  const purpose = p === 'change' ? 'change' : 'create';
  const draft = useStore((s) => s.draft);
  return (
    <CardFailedView
      purpose={purpose}
      summary={
        purpose === 'create' && draft
          ? { name: KIND_NAMES[draft.kind], schedule: scheduleSummary(draft.schedule), stake: stakeRange(draft.maxAmount) }
          : null
      }
      onRetry={() => replace(href.pg(purpose))}
      onLater={() => (purpose === 'create' ? goHome() : router.back())}
    />
  );
}
