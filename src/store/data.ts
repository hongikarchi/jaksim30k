import type {
  AppEvent,
  Card,
  Charge,
  DevSettings,
  Dispute,
  Draft,
  NotificationSettings,
  Occurrence,
  PromiseT,
  Submission,
  User,
} from '../domain/types';

/** 가짜 서버가 들고 있는 전체 데이터. 기기에 저장된다 */
export type Data = {
  version: 1;
  /** 개발용 시간 이동 (ms). 앱 안의 "지금" = 실제 시각 + devOffset */
  devOffset: number;
  user: User | null;
  card: Card | null;
  promises: Record<string, PromiseT>;
  occurrences: Record<string, Occurrence>;
  submissions: Record<string, Submission>;
  disputes: Record<string, Dispute>;
  charges: Record<string, Charge>;
  events: AppEvent[];
  settings: NotificationSettings;
  dev: DevSettings;
  paymentFailedAt?: number;
  draft: Draft | null;
  /** 책읽기 자동완성용 최근 책 */
  books: string[];
};

export const initialData = (): Data => ({
  version: 1,
  devOffset: 0,
  user: null,
  card: null,
  promises: {},
  occurrences: {},
  submissions: {},
  disputes: {},
  charges: {},
  events: [],
  settings: {
    beforeOpen: true,
    beforeOpenMinutes: 10,
    open: true,
    deadline: true,
    deadlineMinutes: 5,
    wideDeadline: true,
    pauseDay: true,
    marketing: false,
  },
  dev: {
    aiResult: 'pass',
    reviewResult: 'pass',
    disputeResult: 'approve',
    nextChargeFails: false,
    nextUploadFails: false,
  },
  draft: null,
  books: [],
});
