import { buildScenario } from '../scenarios';
import { buildHomeModel, HomeView } from '../../screens/Home';
import { nowOf } from '../../store';
import type { Data } from '../../store';
import { noop, type GalleryEntry } from './types';

const model = (name: Parameters<typeof buildScenario>[0]) => {
  const d = buildScenario(name) as Data;
  return buildHomeModel(d as never, nowOf(d));
};

export const entries: GalleryEntry[] = [
  { n: 15, title: '홈: 대기', render: () => <HomeView model={model('waiting')} onNavigate={noop} /> },
  { n: 16, title: '홈: 인증 창 열림', render: () => <HomeView model={model('open')} onNavigate={noop} /> },
  { n: 17, title: '홈: 약속 없음', render: () => <HomeView model={model('empty')} onNavigate={noop} /> },
  { n: 18, title: '홈: 여러 약속 열림', render: () => <HomeView model={model('multi')} onNavigate={noop} /> },
];
