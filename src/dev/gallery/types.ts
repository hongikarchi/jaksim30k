import type { ReactElement } from 'react';

/** 화면 갤러리 항목. n은 SCREENS.md의 화면 번호 */
export type GalleryEntry = {
  n: number;
  title: string;
  /** 같은 번호의 다른 상태 (예: 12번 첫 약속 / 13번 카드 있음) */
  variant?: string;
  render: () => ReactElement;
};

/** 갤러리에서 누른 버튼은 아무 데도 가지 않는다 */
export const noop = () => {};
