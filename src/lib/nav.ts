import { router } from 'expo-router';

import { href } from './routes';

/** 쌓인 화면을 모두 닫고 홈으로 */
export function goHome() {
  if (router.canDismiss()) router.dismissAll();
  router.replace(href.home as never);
}

/** 문자열 주소로 이동 (타입 경고 없이) */
export const go = (to: string) => router.push(to as never);
export const replace = (to: string) => router.replace(to as never);
