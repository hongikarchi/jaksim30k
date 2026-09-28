import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { SCENARIOS, buildScenario, type ScenarioName } from '../../dev/scenarios';
import { useStore } from '../../store';

/** 개발용: /dev/seed?s=open 처럼 예시 데이터를 넣고 홈으로 간다 */
export default function Seed() {
  const { s, to } = useLocalSearchParams<{ s?: string; to?: string }>();
  const [done] = useState(() => {
    const name = (s && s in SCENARIOS ? s : 'waiting') as ScenarioName;
    useStore.setState(buildScenario(name));
    return name;
  });
  return <Redirect href={(to ?? (done === 'new' ? '/welcome' : '/home')) as never} />;
}
