/** 31. 불통과: 다시 찍기 (인증 창이 열려 있는 동안) */
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Button, ClockCard, InfoCard, PhotoCard, Screen, Text } from '../components';
import { clock, hms } from '../domain/rules';
import { href } from '../lib/routes';
import { go, goHome, replace } from '../lib/nav';
import { useNow, useStore } from '../store';
import { latestSubmission, promiseTitle } from '../store/selectors';
import { missionShort, param } from './VerifyShared';

export function RejectedView({
  name,
  uri,
  mission,
  reason,
  end,
  now,
  closed,
  onDispute,
  onRetake,
  onHome,
}: {
  name: string;
  uri?: string;
  mission: string;
  reason: string;
  end: number;
  now: number;
  /** 인증 창이 닫혀 놓친 날이 됨 */
  closed: boolean;
  onDispute: () => void;
  onRetake: () => void;
  onHome: () => void;
}) {
  return (
    <Screen
      topGap="wide"
      gap={16}
      footer={
        <View style={{ gap: 10 }}>
          <Button label="판정이 잘못됐어요" variant="secondary" onPress={onDispute} />
          {closed ? <Button label="홈으로" onPress={onHome} /> : <Button label="다시 찍기" onPress={onRetake} />}
        </View>
      }
    >
      <ClockCard
        tone={closed ? 'ink' : 'signal'}
        label="남은 시간"
        name={name}
        digits={hms(closed ? 0 : end - now)}
        digitsColor={closed ? 'inkRaised' : undefined}
        title={closed ? '인증 시간이 끝났어요' : '다시 찍어주세요'}
        subtitle={reason}
      />
      <PhotoCard
        uri={uri}
        placeholder="제출한 사진"
        items={[
          { label: '오늘의 미션', value: mission },
          { label: '안 된 이유', value: reason },
        ]}
      />
      {closed ? (
        <InfoCard icon="info">
          {clock(end)}까지 다시 찍지 못해서 오늘은 놓친 날이 됐어요. 판정이 잘못됐다면 이의제기할 수 있어요.
        </InfoCard>
      ) : (
        <InfoCard icon="clock">{clock(end)} 전에 다시 찍으면 오늘 약속은 지킨 걸로 해요.</InfoCard>
      )}
    </Screen>
  );
}

export default function RejectedRoute() {
  const occId = param(useLocalSearchParams<{ occ: string }>().occ);
  const now = useNow();
  const d = useStore();
  const o = d.occurrences[occId];
  const p = o ? d.promises[o.promiseId] : undefined;

  if (!o || !p) {
    return (
      <Screen topGap="wide" footer={<Button label="홈으로" onPress={goHome} />}>
        <Text size={20} weight="bold" tight>
          인증 기록을 찾을 수 없어요
        </Text>
      </Screen>
    );
  }

  const s = latestSubmission(d, o);
  return (
    <RejectedView
      name={promiseTitle(p)}
      uri={s?.uri}
      mission={missionShort(p.kind, s?.mission ?? o.mission)}
      reason={s?.aiReason ?? '미션을 확인할 수 없어요'}
      end={o.end}
      now={now}
      closed={o.status === 'missed' || now >= o.end}
      onDispute={() => go(href.dispute(occId))}
      onRetake={() => replace(href.camera(occId))}
      onHome={goHome}
    />
  );
}
