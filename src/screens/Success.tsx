/** 29. 통과: 지킨 날 */
import { useLocalSearchParams } from 'expo-router';

import { Button, ClockCard, InfoCard, PhotoCard, Screen, Text } from '../components';
import { HOUR, clock, clockSec, dateKey, durationLabel, num, parseDateKey } from '../domain/rules';
import type { Occurrence } from '../domain/types';
import { goHome } from '../lib/nav';
import { useNow, useStore } from '../store';
import { latestSubmission, nextLabel, nextOccurrence, promiseTitle } from '../store/selectors';
import { missionShort, param } from './VerifyShared';

export type SuccessModel = {
  name: string;
  keptAt: number;
  end: number;
  uri?: string;
  /** 사진 약속은 사진 자리, 자동 인증은 기록 자리 */
  placeholder: string;
  items: { label: string; value: string }[];
  /** "내일도 06:00에 만나요." 같은 끝 문장 */
  nextLine: string;
};

export function SuccessView({ model, onHome }: { model: SuccessModel; onHome: () => void }) {
  const m = model;
  return (
    <Screen topGap="wide" gap={16} footer={<Button label="홈으로" onPress={onHome} />}>
      <ClockCard
        label="완료 시간"
        name={m.name}
        led="white"
        digits={clockSec(m.keptAt)}
        digitsColor="surface"
        title="오늘도 지켰어요"
        subtitle={`${durationLabel(Math.max(0, m.end - m.keptAt))} 남기고 지켰어요`}
      />
      <PhotoCard uri={m.uri} placeholder={m.placeholder} items={m.items} />
      <InfoCard icon="check">오늘 나간 돈은 0원이에요. {m.nextLine}</InfoCard>
    </Screen>
  );
}

/** "내일도 06:00에 만나요." / "수요일 19:00에 또 만나요." */
export function nextLineOf(next: Occurrence | undefined, now: number) {
  if (!next) return '';
  const days = Math.round((parseDateKey(next.date).getTime() - parseDateKey(dateKey(new Date(now))).getTime()) / (24 * HOUR));
  const at = clock(next.start);
  // 하루 종일 열리는 창(00:00 시작)은 시각을 빼고 말한다
  if (days === 1) return at === '00:00' ? '내일도 만나요.' : `내일도 ${at}에 만나요.`;
  return `${nextLabel(next, now)}에 또 만나요.`;
}

export default function SuccessRoute() {
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
  const keptAt = o.keptAt ?? s?.takenAt ?? now;
  let placeholder = '인증 사진';
  let items: SuccessModel['items'];
  if (p.method === 'strava') {
    placeholder = '러닝 기록';
    items = [
      { label: '거리', value: `${num(o.auto?.distanceKm ?? 0)}km` },
      { label: '판정', value: '통과' },
    ];
  } else if (p.method === 'location') {
    placeholder = p.gym?.placeName || '헬스장';
    items = [
      { label: '머문 시간', value: `${o.auto?.stayedMin ?? 0}분` },
      { label: '판정', value: '통과' },
    ];
  } else {
    items = [
      { label: '오늘의 미션', value: missionShort(p.kind, s?.mission ?? o.mission) },
      { label: '판정', value: o.status === 'excused' ? '이의제기 승인' : '통과' },
    ];
  }

  return (
    <SuccessView
      model={{
        name: promiseTitle(p),
        keptAt,
        end: o.end,
        uri: s?.uri,
        placeholder,
        items,
        nextLine: nextLineOf(nextOccurrence(d, p.id, now), now),
      }}
      onHome={goHome}
    />
  );
}
