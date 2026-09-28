/** 25. 러닝 인증 상태: 인증 창 동안 스트라바 기록을 기다린다 */
import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Linking } from 'react-native';

import { BottomActions, Button, ClockCard, Header, InfoCard, KeyValueRow, Screen, Spacer, TextButton } from '../components';
import { clock, clockSec, hms } from '../domain/rules';
import type { OccurrenceStatus } from '../domain/types';
import { href } from '../lib/routes';
import { goHome, replace } from '../lib/nav';
import { useNow, useStore } from '../store';
import { RUN_MIN_KM } from '../store/engine';
import { km, runRecordLabel, type RunRecord } from './RunFailed';
import { NotFound, WhiteRows, backOrHome, paramOf } from './outcomeParts';

export type RunStatusModel = {
  start: number;
  end: number;
  status: OccurrenceStatus;
  run?: RunRecord;
  keptAt?: number;
  stravaConnected: boolean;
};

export function RunStatusView({
  model,
  now,
  onBack,
  onHome,
  onOpenStrava,
}: {
  model: RunStatusModel;
  now: number;
  onBack: () => void;
  onHome: () => void;
  onOpenStrava: () => void;
}) {
  const { run, status } = model;
  const kept = status === 'kept' || status === 'excused';
  const before = !kept && now < model.start;
  const d = run?.distanceKm;

  const card = kept
    ? {
        label: '완료 시간',
        digits: model.keptAt ? clockSec(model.keptAt) : '--:--:--',
        digitsColor: 'surface' as const,
        title: '오늘도 지켰어요',
        subtitle: d !== undefined ? `${km(d)}를 달려서 지킨 날로 기록했어요` : '지킨 날로 기록했어요',
      }
    : before
      ? {
          label: '시작까지',
          digits: hms(model.start - now),
          title: '아직 인증 시간이 아니에요',
          subtitle: `${clock(model.start)}–${clock(model.end)}에 달린 기록만 인정돼요`,
        }
      : d === undefined
        ? {
            label: '남은 시간',
            digits: hms(model.end - now),
            title: '기록을 기다리고 있어요',
            subtitle: '달리기를 마치고 스트라바에 저장하면 확인해요',
          }
        : run?.manual
          ? {
              label: '남은 시간',
              digits: hms(model.end - now),
              title: '수동 입력 기록은 인정되지 않아요',
              subtitle: '스트라바로 기록하며 다시 달려주세요',
            }
          : {
              label: '남은 시간',
              digits: hms(model.end - now),
              title: '거리가 모자라요',
              subtitle: `${km(d)}를 달렸어요. 한 번에 ${RUN_MIN_KM}km 이상 달려주세요`,
            };

  return (
    <Screen
      footer={
        kept ? (
          <BottomActions>
            <Button label="홈으로" onPress={onHome} />
          </BottomActions>
        ) : (
          <BottomActions>
            <TextButton label="홈으로" onPress={onHome} />
            <Button label="스트라바 열기" onPress={onOpenStrava} />
          </BottomActions>
        )
      }
    >
      <Header onBack={onBack} />
      <ClockCard
        label={card.label}
        name="러닝"
        led={kept ? 'white' : 'on'}
        digits={card.digits}
        digitsColor={'digitsColor' in card ? card.digitsColor : undefined}
        title={card.title}
        subtitle={card.subtitle}
      />
      <WhiteRows>
        <KeyValueRow label="오늘 필요한 거리" value={`${RUN_MIN_KM}km 이상`} />
        <KeyValueRow label="확인된 기록" value={runRecordLabel(run, '아직 없음')} />
        <KeyValueRow label="스트라바" value={model.stravaConnected ? '연결됨' : '연결 안 됨'} last />
      </WhiteRows>
      {kept ? null : (
        <InfoCard icon="bell">
          기록이 올라오면 바로 판정하고 알림으로 알려드려요. 수동으로 입력한 기록은 인정되지 않아요.
        </InfoCard>
      )}
      <Spacer />
    </Screen>
  );
}

/** 스트라바 앱이 없으면 웹으로 */
function openStrava() {
  Linking.openURL('strava://').catch(() => Linking.openURL('https://www.strava.com'));
}

export default function RunStatusRoute() {
  const occ = paramOf(useLocalSearchParams<{ occ: string }>().occ);
  const now = useNow();
  const d = useStore();
  const o = d.occurrences[occ];

  // 마감까지 기록이 모자라면 러닝 인증 실패로
  const failed = o?.status === 'missed';
  useEffect(() => {
    if (failed) replace(href.runFailed(occ));
  }, [failed, occ]);

  if (!o) return <NotFound onHome={goHome} />;
  return (
    <RunStatusView
      model={{
        start: o.start,
        end: o.end,
        status: o.status,
        run: o.auto,
        keptAt: o.keptAt,
        stravaConnected: !!d.user?.stravaConnected,
      }}
      now={now}
      onBack={backOrHome}
      onHome={goHome}
      onOpenStrava={openStrava}
    />
  );
}
