/** 도메인 모델 (SPEC 7.1). 가짜 서버와 화면이 같은 타입을 쓴다 */

export type PromiseKind = 'morning' | 'run' | 'gym' | 'book' | 'room';
export type VerifyMethod = 'photo' | 'strava' | 'location';

export type HM = { h: number; m: number };
export type Window = { start: HM; end: HM };
/** 월~일 7칸. null이면 그 요일은 약속 없음 */
export type Schedule = (Window | null)[];

export type Watcher = {
  name: string;
  scope: 'missed' | 'daily';
  status: 'invited' | 'connected';
  invitedAt: number;
  connectedAt?: number;
};

export type PromiseT = {
  id: string;
  kind: PromiseKind;
  schedule: Schedule;
  method: VerifyMethod;
  /** 한 번에 낼 최대 금액 */
  maxAmount: number;
  /** 지금까지 놓친(결제 단계가 오른) 횟수. 금액 단계를 정한다 */
  missCount: number;
  status: 'active' | 'ended';
  createdAt: number;
  endedAt?: number;
  gym?: { placeName: string; stayMinutes: number };
  room?: { checklist: string[]; refPhotoUri?: string };
  watcher?: Watcher;
  /** 'YYYY-MM' → 그 달에 쓴 쉬어가기 횟수 */
  pausesByMonth: Record<string, number>;
};

export type OccurrenceStatus =
  | 'upcoming' // 창 열리기 전
  | 'open' // 창 열림, 아직 인증 전
  | 'judging' // AI 판정 중
  | 'rejected' // AI 불통과, 창 안이면 다시 찍기
  | 'reviewing' // 사람 검수 중 (최대 6시간)
  | 'kept' // 지킨 날
  | 'missed' // 놓친 날
  | 'paused' // 쉬어가는 날
  | 'excused'; // 이의제기 승인으로 지킨 날 처리

export type Occurrence = {
  id: string;
  promiseId: string;
  /** YYYY-MM-DD (창이 시작하는 날) */
  date: string;
  start: number;
  end: number;
  status: OccurrenceStatus;
  mission?: string;
  submissionIds: string[];
  keptAt?: number;
  missedAt?: number;
  chargeId?: string;
  disputeId?: string;
  /** 자동 인증 기록 */
  auto?: { distanceKm?: number; manual?: boolean; stayedMin?: number; activityAt?: number; arrivedAt?: number };
};

export type AiResult = 'pass' | 'unclear' | 'fail';

export type Submission = {
  id: string;
  occurrenceId: string;
  uri?: string;
  takenAt: number;
  submittedAt?: number;
  mission?: string;
  ai?: AiResult;
  aiReason?: string;
  reviewDueAt?: number;
  review?: 'pass' | 'miss';
  book?: { title: string; line: string };
  uploadFailed?: boolean;
};

export type DisputeReason = 'app_error' | 'wrong_fail' | 'sick' | 'other';

export type Dispute = {
  id: string;
  occurrenceId: string;
  reason: DisputeReason;
  note: string;
  status: 'reviewing' | 'approved' | 'denied';
  createdAt: number;
  dueAt: number;
  resolvedAt?: number;
  denyReason?: string;
};

export type ChargeStatus = 'scheduled' | 'held' | 'paid' | 'failed' | 'canceled';

export type Charge = {
  id: string;
  occurrenceId: string;
  promiseId: string;
  amount: number;
  scheduledAt: number;
  status: ChargeStatus;
  paidAt?: number;
  failedAt?: number;
  canceledAt?: number;
};

export type Card = { company: string; last4: string; registeredAt: number };

export type ProState = {
  status: 'free' | 'trial' | 'pro';
  plan?: 'month' | 'year';
  trialEndsAt?: number;
  renewsAt?: number;
  startedAt?: number;
};

export type User = {
  provider: 'kakao' | 'apple';
  name: string;
  createdAt: number;
  permissions: { notifications: boolean; camera: boolean; location: boolean };
  pro: ProState;
  stravaConnected: boolean;
};

export type NotificationSettings = {
  beforeOpen: boolean;
  beforeOpenMinutes: 5 | 10 | 30;
  open: boolean;
  deadline: boolean;
  deadlineMinutes: 5 | 10 | 30;
  wideDeadline: boolean;
  pauseDay: boolean;
  marketing: boolean;
};

/** 알림으로 진입하는 화면을 띄우기 위한 사건 기록 */
export type AppEventType =
  | 'missed'
  | 'auto_failed'
  | 'review_done'
  | 'dispute_result'
  | 'payment_failed'
  | 'charged'
  | 'watcher_connected'
  | 'trial_ending';

export type AppEvent = {
  id: string;
  type: AppEventType;
  at: number;
  occurrenceId?: string;
  chargeId?: string;
  disputeId?: string;
  promiseId?: string;
  seen: boolean;
};

/** 개발용 설정: 가짜 서버의 판정·결제 결과를 정한다 */
export type DevSettings = {
  aiResult: AiResult | 'random';
  reviewResult: 'pass' | 'miss';
  disputeResult: 'approve' | 'deny';
  nextChargeFails: boolean;
  nextUploadFails: boolean;
};

/** 약속 만들기 중인 초안 */
export type Draft = {
  kind: PromiseKind;
  schedule: Schedule;
  method: VerifyMethod;
  maxAmount: number;
  gym?: { placeName: string; stayMinutes: number };
  room?: { checklist: string[]; refPhotoUri?: string };
};
