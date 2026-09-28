import { DisputeView } from '../../screens/Dispute';
import { DisputeResultView } from '../../screens/DisputeResult';
import { DisputeSubmittedView } from '../../screens/DisputeSubmitted';
import { GymAutoStatusView } from '../../screens/GymAutoStatus';
import { GymFailedView } from '../../screens/GymFailed';
import { MissedView, type MissedInfo } from '../../screens/Missed';
import { PaymentFailedView } from '../../screens/PaymentFailed';
import { RunFailedView } from '../../screens/RunFailed';
import { RunStatusView } from '../../screens/RunStatus';
import { noop, type GalleryEntry } from './types';

const at = (mo: number, d: number, h: number, mi: number, s = 0) => new Date(2026, mo - 1, d, h, mi, s).getTime();
const HOUR = 3600_000;

const actions = { onDispute: noop, onDisputeStatus: noop, onPaymentFailed: noop, onHome: noop };

/** 화 06:11:48, 미라클모닝 06:00–06:10 놓침 */
const missedNow = at(9, 29, 6, 11, 48);
const missed: MissedInfo = {
  name: '미라클모닝',
  date: at(9, 29, 6, 0),
  charge: { amount: 5000, scheduledAt: at(9, 30, 6, 10), status: 'scheduled' },
  card: '신한카드 •••• 4821',
  nextAmount: 10000,
};

/** 월 22:47:20, 러닝 19:00–22:00 놓침 */
const runNow = at(9, 28, 22, 47, 20);
const runMissed: MissedInfo = {
  name: '러닝',
  date: at(9, 28, 19, 0),
  charge: { amount: 5000, scheduledAt: at(9, 29, 22, 0), status: 'scheduled' },
  card: '신한카드 •••• 4821',
  nextAmount: 10000,
};

/** 월 23:47:20, 헬스장 19:00–23:00 놓침 */
const gymNow = at(9, 28, 23, 47, 20);
const gymMissed: MissedInfo = {
  name: '헬스장',
  date: at(9, 28, 19, 0),
  charge: { amount: 10000, scheduledAt: at(9, 29, 23, 0), status: 'scheduled' },
  card: '신한카드 •••• 4821',
  nextAmount: 10000,
};

export const entries: GalleryEntry[] = [
  {
    n: 25,
    title: '러닝 인증 상태',
    render: () => (
      <RunStatusView
        model={{ start: at(9, 28, 19, 0), end: at(9, 28, 22, 0), status: 'open', stravaConnected: true }}
        now={at(9, 28, 21, 11, 48)}
        onBack={noop}
        onHome={noop}
        onOpenStrava={noop}
      />
    ),
  },
  {
    n: 25,
    variant: '거리모자람',
    title: '러닝 인증 상태: 거리 모자람',
    render: () => (
      <RunStatusView
        model={{
          start: at(9, 28, 19, 0),
          end: at(9, 28, 22, 0),
          status: 'open',
          run: { distanceKm: 3.2, activityAt: at(9, 28, 20, 25) },
          stravaConnected: true,
        }}
        now={at(9, 28, 21, 11, 48)}
        onBack={noop}
        onHome={noop}
        onOpenStrava={noop}
      />
    ),
  },
  {
    n: 25,
    variant: '지킴',
    title: '러닝 인증 상태: 지킴',
    render: () => (
      <RunStatusView
        model={{
          start: at(9, 28, 19, 0),
          end: at(9, 28, 22, 0),
          status: 'kept',
          run: { distanceKm: 5.4, activityAt: at(9, 28, 20, 25, 10) },
          keptAt: at(9, 28, 20, 25, 10),
          stravaConnected: true,
        }}
        now={at(9, 28, 21, 11, 48)}
        onBack={noop}
        onHome={noop}
        onOpenStrava={noop}
      />
    ),
  },
  {
    n: 26,
    title: '헬스장 자동 인증 상태',
    render: () => (
      <GymAutoStatusView
        model={{
          start: at(9, 28, 19, 0),
          end: at(9, 28, 23, 0),
          status: 'open',
          stayedMin: 18,
          needMinutes: 30,
          placeName: '스포애니 합정점',
          activityAt: at(9, 28, 21, 16),
        }}
        now={at(9, 28, 21, 20, 30)}
        onBack={noop}
        onHome={noop}
      />
    ),
  },
  {
    n: 26,
    variant: '지킴',
    title: '헬스장 자동 인증 상태: 지킴',
    render: () => (
      <GymAutoStatusView
        model={{
          start: at(9, 28, 19, 0),
          end: at(9, 28, 23, 0),
          status: 'kept',
          stayedMin: 30,
          needMinutes: 30,
          placeName: '스포애니 합정점',
          activityAt: at(9, 28, 21, 28),
          keptAt: at(9, 28, 21, 28, 4),
        }}
        now={at(9, 28, 21, 40)}
        onBack={noop}
        onHome={noop}
      />
    ),
  },
  { n: 32, title: '놓친 날', render: () => <MissedView info={missed} now={missedNow} {...actions} /> },
  {
    n: 32,
    variant: '연습0원',
    title: '놓친 날: 첫 번째 0원',
    render: () => (
      <MissedView
        info={{ ...missed, charge: { ...missed.charge!, amount: 0 }, nextAmount: 5000 }}
        now={missedNow}
        {...actions}
      />
    ),
  },
  {
    n: 32,
    variant: '이의제기중',
    title: '놓친 날: 이의제기 확인 중',
    render: () => (
      <MissedView
        info={{
          ...missed,
          charge: { ...missed.charge!, status: 'held' },
          dispute: { id: 'dp', status: 'reviewing', dueAt: missedNow + 11 * HOUR + 58 * 60_000 },
        }}
        now={missedNow}
        {...actions}
      />
    ),
  },
  {
    n: 33,
    title: '러닝 인증 실패',
    render: () => (
      <RunFailedView
        info={runMissed}
        run={{ distanceKm: 3.2, activityAt: at(9, 28, 19, 40) }}
        now={runNow}
        {...actions}
      />
    ),
  },
  {
    n: 33,
    variant: '기록없음',
    title: '러닝 인증 실패: 기록 없음',
    render: () => <RunFailedView info={runMissed} now={runNow} {...actions} />,
  },
  {
    n: 34,
    title: '헬스장 인증 실패',
    render: () => (
      <GymFailedView
        info={gymMissed}
        stay={{ stayedMin: 18, activityAt: at(9, 28, 21, 16) }}
        needMinutes={30}
        now={gymNow}
        {...actions}
      />
    ),
  },
  { n: 35, title: '이의제기', render: () => <DisputeView onBack={noop} onSubmit={noop} /> },
  {
    n: 36,
    title: '이의제기 접수',
    render: () => (
      <DisputeSubmittedView
        model={{
          name: '미라클모닝',
          date: at(9, 29, 6, 0),
          reason: 'wrong_fail',
          dueAt: at(9, 29, 18, 13, 6),
          amount: 5000,
        }}
        now={at(9, 29, 6, 14, 24)}
        onHome={noop}
      />
    ),
  },
  {
    n: 37,
    title: '이의제기 결과: 승인',
    render: () => (
      <DisputeResultView
        model={{
          status: 'approved',
          name: '미라클모닝',
          date: at(9, 29, 6, 0),
          reason: 'app_error',
          charge: { amount: 5000, scheduledAt: at(9, 30, 6, 10), status: 'canceled' },
          nextAmount: 5000,
        }}
        now={at(9, 29, 6, 15)}
        onHome={noop}
        onSupport={noop}
      />
    ),
  },
  {
    n: 38,
    title: '이의제기 결과: 거절',
    render: () => (
      <DisputeResultView
        model={{
          status: 'denied',
          name: '미라클모닝',
          date: at(9, 29, 6, 0),
          reason: 'wrong_fail',
          denyReason: '사진 제출 시각이 06:12로, 인증 시간(06:10)이 지난 뒤였어요.',
          charge: { amount: 5000, scheduledAt: at(9, 29, 21, 40), status: 'scheduled' },
          nextAmount: 10000,
        }}
        now={at(9, 29, 9, 40)}
        onHome={noop}
        onSupport={noop}
      />
    ),
  },
  {
    n: 39,
    title: '결제 실패',
    render: () => (
      <PaymentFailedView
        model={{
          variant: 'failed',
          items: [{ id: 'c1', name: '미라클모닝', date: at(9, 28, 6, 0), amount: 5000 }],
          card: '신한카드 •••• 4821',
          deadline: at(9, 29, 7, 0) + 72 * HOUR,
        }}
        now={at(9, 29, 7, 12)}
        onChangeCard={noop}
        onHome={noop}
      />
    ),
  },
  {
    n: 39,
    variant: '해결됨',
    title: '결제 실패: 카드 바꾼 뒤',
    render: () => (
      <PaymentFailedView
        model={{
          variant: 'resolved',
          items: [{ id: 'c1', name: '미라클모닝', date: at(9, 28, 6, 0), amount: 5000 }],
          card: '현대카드 •••• 1934',
        }}
        now={at(9, 29, 7, 20)}
        onChangeCard={noop}
        onHome={noop}
      />
    ),
  },
];
