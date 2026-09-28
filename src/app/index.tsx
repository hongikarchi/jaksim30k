import { Redirect } from 'expo-router';

import { useStore } from '../store';

/** 첫 화면 결정: 로그인 전 → 시작, 로그인 후 → 홈 (SPEC 4.2) */
export default function Index() {
  const user = useStore((s) => s.user);
  if (!user) return <Redirect href="/welcome" />;
  return <Redirect href="/home" />;
}
