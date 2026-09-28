import { buildScenario, type ScenarioName } from '../scenarios';
import { buildEndPromiseModel, EndPromiseView } from '../../screens/EndPromise';
import { buildPauseModel, PauseView } from '../../screens/Pause';
import { buildPromiseDetailModel, PromiseDetailView, type DetailSheet } from '../../screens/PromiseDetail';
import { WatcherConnectedView } from '../../screens/WatcherConnected';
import { WatcherMessageView } from '../../screens/WatcherMessage';
import { WatcherSetupView } from '../../screens/WatcherSetup';
import { nowOf } from '../../store';
import { activePromises } from '../../store/selectors';
import { noop, type GalleryEntry } from './types';

/** 예시 데이터의 첫 약속 (미라클모닝) */
const scenario = (name: ScenarioName) => {
  const d = buildScenario(name);
  return { d, now: nowOf(d), id: activePromises(d)[0].id };
};

const detail = (name: ScenarioName, sheet?: DetailSheet) => {
  const { d, now, id } = scenario(name);
  return (
    <PromiseDetailView
      model={buildPromiseDetailModel(d, id, now)!}
      initialSheet={sheet}
      onBack={noop}
      onNavigate={noop}
      onPrevMonth={noop}
      onNextMonth={noop}
      onSaveSchedule={noop}
      onSaveMax={noop}
    />
  );
};

const endedDetail = () => {
  const d = buildScenario('empty');
  const p = Object.values(d.promises)[0];
  return (
    <PromiseDetailView
      model={buildPromiseDetailModel(d, p.id, nowOf(d))!}
      onBack={noop}
      onNavigate={noop}
      onPrevMonth={noop}
      onNextMonth={noop}
      onSaveSchedule={noop}
      onSaveMax={noop}
    />
  );
};

const pause = (picked?: boolean) => {
  const { d, now, id } = scenario('waiting');
  const model = buildPauseModel(d, id, now)!;
  return <PauseView model={model} initialPicked={picked ? [model.days[0].date] : []} onBack={noop} onSubmit={noop} />;
};

const end = () => {
  const { d, now, id } = scenario('waiting');
  return <EndPromiseView model={buildEndPromiseModel(d, id, now)!} onBack={noop} onNavigate={noop} onEnd={noop} />;
};

export const entries: GalleryEntry[] = [
  { n: 40, title: '약속 상세', render: () => detail('waiting') },
  { n: 40, variant: '인증시간', title: '약속 상세: 인증 시간 시트', render: () => detail('waiting', 'time') },
  { n: 40, variant: '금액', title: '약속 상세: 금액 단계 시트', render: () => detail('waiting', 'stake') },
  { n: 40, variant: '프로', title: '약속 상세: 프로, 감시자 연결', render: () => detail('pro') },
  { n: 40, variant: '끝남', title: '약속 상세: 끝낸 약속', render: endedDetail },
  { n: 41, title: '쉬어가기 예약', render: () => pause() },
  { n: 41, variant: '고름', title: '쉬어가기 예약: 날짜 고름', render: () => pause(true) },
  {
    n: 42,
    title: '감시자 지정',
    render: () => <WatcherSetupView promiseName="미라클모닝" onBack={noop} onInvite={noop} />,
  },
  {
    n: 43,
    title: '감시자가 받는 메시지',
    render: () => (
      <WatcherMessageView
        model={{
          userName: '박서연',
          promiseName: '미라클모닝',
          schedule: '평일 06:00–06:10',
          window: '06:00–06:10',
          watcherName: '김지수',
          scope: 'missed',
        }}
        onBack={noop}
        onDone={noop}
        onCancel={noop}
      />
    ),
  },
  {
    n: 44,
    title: '감시자 연결됨',
    render: () => (
      <WatcherConnectedView
        promiseName="미라클모닝"
        watcher={{ name: '김지수', scope: 'missed', connectedAt: new Date(2026, 8, 20).getTime() }}
        onBack={noop}
        onRemove={noop}
        onSave={noop}
      />
    ),
  },
  { n: 45, title: '약속 끝내기', render: end },
];
