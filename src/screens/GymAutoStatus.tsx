/** 26. 헬스장 자동 인증 상태: 등록한 위치에 머문 시간을 쌓는다 */
import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { BottomActions, Button, ClockCard, Header, InfoCard, KeyValueRow, Screen, Spacer, Text } from '../components';
import { clock, clockSec, hms } from '../domain/rules';
import type { OccurrenceStatus } from '../domain/types';
import { href } from '../lib/routes';
import { goHome, replace } from '../lib/nav';
import { useNow, useStore } from '../store';
import { colors } from '../theme';
import { NotFound, ProgressBar, WhiteRows, backOrHome, paramOf } from './outcomeParts';

export type GymStatusModel = {
  start: number;
  end: number;
  status: OccurrenceStatus;
  stayedMin: number;
  needMinutes: number;
  placeName: string;
  /** 마지막으로 위치가 확인된 시각 */
  activityAt?: number;
  keptAt?: number;
};

export function GymAutoStatusView({
  model: m,
  now,
  onBack,
  onHome,
}: {
  model: GymStatusModel;
  now: number;
  onBack: () => void;
  onHome: () => void;
}) {
  const kept = m.status === 'kept' || m.status === 'excused';
  const before = !kept && now < m.start;
  const stayed = kept ? Math.max(m.stayedMin, m.needMinutes) : m.stayedMin;
  const left = Math.max(0, m.needMinutes - m.stayedMin);

  const card = kept
    ? {
        label: '완료 시간',
        digits: m.keptAt ? clockSec(m.keptAt) : '--:--:--',
        title: '오늘도 지켰어요',
        subtitle: `${m.needMinutes}분 머물러서 지킨 날로 기록했어요`,
      }
    : before
      ? {
          label: '시작까지',
          digits: hms(m.start - now),
          title: '아직 인증 시간이 아니에요',
          subtitle: `${clock(m.start)}부터 머문 시간을 세요`,
        }
      : m.stayedMin === 0
        ? {
            label: '남은 시간',
            digits: hms(m.end - now),
            title: '헬스장에 도착하면 시작돼요',
            subtitle: `${m.needMinutes}분 머물면 자동으로 인증돼요`,
          }
        : {
            label: '남은 시간',
            digits: hms(m.end - now),
            title: '헬스장에 도착했어요',
            subtitle: `${left}분 더 머물면 자동으로 인증돼요`,
          };

  return (
    <Screen
      footer={
        <BottomActions>
          <Button label="홈으로" onPress={onHome} />
        </BottomActions>
      }
    >
      <Header onBack={onBack} />
      <ClockCard
        label={card.label}
        name="헬스장"
        led={kept ? 'white' : 'on'}
        digits={card.digits}
        digitsColor={kept ? 'surface' : undefined}
        title={card.title}
        subtitle={card.subtitle}
      />
      <View style={{ gap: 8, paddingVertical: 18, paddingHorizontal: 20, borderRadius: 22, backgroundColor: colors.surface }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text size={14} color="text3">
            머문 시간
          </Text>
          <Text size={14} weight="bold">
            {stayed}분 / {m.needMinutes}분
          </Text>
        </View>
        <ProgressBar ratio={stayed / m.needMinutes} />
      </View>
      <WhiteRows>
        <KeyValueRow label="마지막 확인" value={m.activityAt ? clock(m.activityAt) : '아직 없음'} />
        <KeyValueRow label="인증 위치" value={m.placeName || '등록한 헬스장'} last />
      </WhiteRows>
      {kept ? null : (
        <InfoCard icon="bell">
          중간에 나갔다 와도 머문 시간은 이어서 쌓여요. 인증 시간 안에 {m.needMinutes}분을 채우면 돼요.
        </InfoCard>
      )}
      <Spacer />
    </Screen>
  );
}


export default function GymAutoStatusRoute() {
  const occ = paramOf(useLocalSearchParams<{ occ: string }>().occ);
  const now = useNow();
  const d = useStore();
  const o = d.occurrences[occ];
  const p = o && d.promises[o.promiseId];

  // 마감까지 못 채우면 헬스장 인증 실패로
  const failed = o?.status === 'missed';
  useEffect(() => {
    if (failed) replace(href.gymFailed(occ));
  }, [failed, occ]);

  if (!o || !p) return <NotFound onHome={goHome} />;
  return (
    <GymAutoStatusView
      model={{
        start: o.start,
        end: o.end,
        status: o.status,
        stayedMin: o.auto?.stayedMin ?? 0,
        needMinutes: p.gym?.stayMinutes ?? 30,
        placeName: p.gym?.placeName ?? '',
        activityAt: o.auto?.activityAt,
        keptAt: o.keptAt,
      }}
      now={now}
      onBack={backOrHome}
      onHome={goHome}
    />
  );
}
