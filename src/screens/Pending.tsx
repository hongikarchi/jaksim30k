/** 30. 애매: 판정 확인 중 (사람 검수, 제출 후 최대 6시간) */
import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { Button, ClockCard, InfoCard, PhotoCard, Screen, Text } from '../components';
import { HOUR, clock, hms } from '../domain/rules';
import { href } from '../lib/routes';
import { goHome, replace } from '../lib/nav';
import { useNow, useStore } from '../store';
import { REVIEW_HOURS } from '../store/engine';
import { latestSubmission, promiseTitle } from '../store/selectors';
import { markOccEventsSeen, missionShort, param } from './VerifyShared';

export function PendingView({
  name,
  uri,
  mission,
  reason,
  dueAt,
  now,
  onHome,
}: {
  name: string;
  uri?: string;
  mission: string;
  reason: string;
  dueAt: number;
  now: number;
  onHome: () => void;
}) {
  return (
    <Screen topGap="wide" gap={16} footer={<Button label="홈으로" onPress={onHome} />}>
      <ClockCard
        label="판정 예정까지"
        name={name}
        digits={hms(dueAt - now)}
        digitsColor="surface"
        title="사람이 한 번 더 보고 있어요"
        subtitle={`${clock(dueAt)}까지 결과를 알려드려요`}
      />
      <PhotoCard
        uri={uri}
        items={[
          { label: '오늘의 미션', value: mission },
          { label: '확인 이유', value: reason },
        ]}
      />
      <InfoCard icon="shield">시간 안에 제출했으니, 결과가 나올 때까지 실패로 처리하지 않아요.</InfoCard>
    </Screen>
  );
}

export default function PendingRoute() {
  const occId = param(useLocalSearchParams<{ occ: string }>().occ);
  const now = useNow();
  const d = useStore();
  const o = d.occurrences[occId];
  const p = o ? d.promises[o.promiseId] : undefined;
  const status = o?.status;

  // 검수가 끝나면(스토어 tick이 처리) 결과 화면으로 바꾼다
  useEffect(() => {
    if (!status || status === 'reviewing' || status === 'judging') return;
    const to =
      status === 'kept' || status === 'excused' ? href.success(occId) : status === 'missed' ? href.missed(occId) : null;
    if (!to) return;
    markOccEventsSeen(useStore.getState(), occId, ['review_done', 'missed']);
    replace(to);
  }, [status, occId]);

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
    <PendingView
      name={promiseTitle(p)}
      uri={s?.uri}
      mission={missionShort(p.kind, s?.mission ?? o.mission)}
      reason={s?.aiReason ?? '사진을 한 번 더 확인해요'}
      dueAt={s?.reviewDueAt ?? (s?.submittedAt ?? now) + REVIEW_HOURS * HOUR}
      now={now}
      onHome={goHome}
    />
  );
}
