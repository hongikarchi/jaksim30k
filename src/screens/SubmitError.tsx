/** 28. 제출 실패: 인증 창 안에 찍은 사진은 늦게 보내도 인정 (SPEC 2.2-5) */
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { BottomActions, Button, ClockCard, InfoCard, PhotoCard, Screen, Text, TextButton } from '../components';
import { clockSec, hms } from '../domain/rules';
import { href } from '../lib/routes';
import { goHome, replace } from '../lib/nav';
import { useNow, useStore } from '../store';
import { promiseTitle } from '../store/selectors';
import { acceptsPhoto, param } from './VerifyShared';

export function SubmitErrorView({
  name,
  uri,
  takenAt,
  now,
  end,
  canRetake,
  onRetry,
  onRetake,
  onHome,
}: {
  name: string;
  uri?: string;
  takenAt: number;
  now: number;
  end: number;
  /** 인증 창이 아직 열려 있으면 다시 찍기, 닫혔으면 홈으로 */
  canRetake: boolean;
  onRetry: () => void;
  onRetake: () => void;
  onHome: () => void;
}) {
  return (
    <Screen
      footer={
        <View style={{ gap: 8 }}>
          {canRetake ? <TextButton label="다시 찍기" onPress={onRetake} /> : <TextButton label="나중에 보내기" onPress={onHome} />}
          <Button label="다시 보내기" onPress={onRetry} />
        </View>
      }
    >
      <View style={{ height: 8 }} />
      <ClockCard
        label="남은 시간"
        name={name}
        digits={hms(end - now)}
        title="사진을 보내지 못했어요"
        subtitle="인터넷 연결을 확인해 주세요"
      />
      <PhotoCard
        uri={uri}
        placeholder="찍어둔 사진"
        items={[
          { label: '촬영 시각', value: clockSec(takenAt) },
          { label: '상태', value: '휴대폰에 저장됨' },
        ]}
      />
      <InfoCard icon="shield">인증 시간 안에 찍은 사진이라, 연결이 돌아오면 늦게 보내도 지킨 걸로 해요.</InfoCard>
    </Screen>
  );
}

export default function SubmitErrorRoute() {
  const subId = param(useLocalSearchParams<{ sub: string }>().sub);
  const now = useNow();
  const s = useStore((d) => d.submissions[subId]);
  const o = useStore((d) => (s ? d.occurrences[s.occurrenceId] : undefined));
  const p = useStore((d) => (o ? d.promises[o.promiseId] : undefined));

  if (!s || !o || !p) {
    return (
      <Screen topGap="wide" footer={<Button label="홈으로" onPress={goHome} />}>
        <Text size={20} weight="bold" tight>
          제출한 사진을 찾을 수 없어요
        </Text>
      </Screen>
    );
  }

  return (
    <SubmitErrorView
      name={promiseTitle(p)}
      uri={s.uri}
      takenAt={s.takenAt}
      now={now}
      end={o.end}
      canRetake={acceptsPhoto(o, now)}
      onRetry={() => {
        useStore.getState().retryUpload(subId);
        // 창 안에서 찍은 사진이면 판정으로, 그 사이 이미 결과가 난 창이면 그 결과로
        const st = useStore.getState().occurrences[o.id]?.status;
        if (st === 'judging') replace(href.judging(subId));
        else if (st === 'kept' || st === 'excused') replace(href.success(o.id));
        else if (st === 'missed') replace(href.missed(o.id));
        else goHome();
      }}
      onRetake={() => replace(href.camera(o.id))}
      onHome={goHome}
    />
  );
}
