import { presetSchedule } from '../../domain/rules';
import { GoalView, type GoalViewProps } from '../../screens/Goal';
import { GymMethodView, type GymMethodViewProps } from '../../screens/GymMethod';
import { LoginView } from '../../screens/Login';
import { PermissionsView } from '../../screens/Permissions';
import { RunConnectView } from '../../screens/RunConnect';
import { WelcomeView } from '../../screens/Welcome';
import { noop, type GalleryEntry } from './types';

/** 와이어프레임의 예시 시각 07:42 */
const AT_0742 = new Date(2026, 8, 28, 7, 42).getTime();

const goal = (p: Partial<GoalViewProps> = {}) => (
  <GoalView
    kind="morning"
    schedule={presetSchedule('morning')}
    isPro={false}
    onPick={noop}
    onSchedule={noop}
    onNext={noop}
    onBack={noop}
    onPro={noop}
    onChangeCard={noop}
    {...p}
  />
);

const gym = (p: Partial<GymMethodViewProps> = {}) => (
  <GymMethodView
    method="location"
    placeName=""
    stayMinutes={30}
    isPro
    locationGranted
    onChange={noop}
    onRequestLocation={async () => true}
    onNext={noop}
    onBack={noop}
    onPro={noop}
    {...p}
  />
);

export const entries: GalleryEntry[] = [
  { n: 1, title: '시작', render: () => <WelcomeView now={AT_0742} onStart={noop} /> },
  { n: 2, title: '로그인', render: () => <LoginView onBack={noop} onLogin={noop} /> },
  { n: 3, title: '권한 요청', render: () => <PermissionsView onBack={noop} onAllow={noop} /> },
  { n: 4, title: '약속 고르기', render: () => goal() },
  {
    n: 4,
    variant: '요일마다',
    title: '약속 고르기: 요일마다 다르게',
    render: () =>
      goal({
        schedule: presetSchedule('morning').map((w, i) =>
          w && i === 4 ? { start: { h: 7, m: 0 }, end: { h: 7, m: 10 } } : w,
        ),
        initialSheet: 'days',
      }),
  },
  { n: 4, variant: '결제실패', title: '약속 고르기: 결제 실패로 막힘', render: () => goal({ blocked: true }) },
  { n: 5, title: '프로 잠금 안내', render: () => goal({ initialSheet: 'lock' }) },
  {
    n: 6,
    title: '러닝 연결',
    render: () => (
      <RunConnectView schedule={presetSchedule('run')} connected={false} onBack={noop} onConnect={noop} onNext={noop} />
    ),
  },
  {
    n: 6,
    variant: '연결됨',
    title: '러닝 연결: 연결됨',
    render: () => <RunConnectView schedule={presetSchedule('run')} connected onBack={noop} onConnect={noop} onNext={noop} />,
  },
  { n: 7, title: '헬스장 인증 방식', render: () => gym() },
  { n: 7, variant: '사진', title: '헬스장 인증 방식: 사진', render: () => gym({ method: 'photo' }) },
  {
    n: 8,
    title: '헬스장 위치 권한 요청',
    render: () => gym({ method: 'photo', locationGranted: false, initialSheet: 'perm' }),
  },
];
