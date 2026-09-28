/** 화면 주소 모음. 화면끼리 주소 문자열을 직접 만들지 말고 여기 함수를 쓴다 */
import type { AppEvent, Occurrence, PromiseT } from '../domain/types';
import type { Data } from '../store';

export const href = {
  welcome: '/welcome',
  login: '/login',
  permissions: '/permissions',
  home: '/home',
  goal: '/create/goal',
  runConnect: '/create/run-connect',
  gymMethod: '/create/gym-method',
  roomSetup: '/create/room-setup',
  roomCamera: '/create/room-camera',
  stake: '/create/stake',
  confirm: '/create/confirm',
  cardFailed: (purpose: 'create' | 'change') => `/create/card-failed?purpose=${purpose}`,
  pg: (purpose: 'create' | 'change') => `/pg?purpose=${purpose}`,
  camera: (occ: string) => `/verify/${encodeURIComponent(occ)}`,
  photoConfirm: (occ: string, uri: string, takenAt: number) =>
    `/verify/confirm?occ=${encodeURIComponent(occ)}&uri=${encodeURIComponent(uri)}&takenAt=${takenAt}`,
  bookRecord: (occ: string, uri: string, takenAt: number) =>
    `/verify/book-record?occ=${encodeURIComponent(occ)}&uri=${encodeURIComponent(uri)}&takenAt=${takenAt}`,
  judging: (sub: string) => `/verify/judging?sub=${sub}`,
  submitError: (sub: string) => `/verify/submit-error?sub=${sub}`,
  runStatus: (occ: string) => `/run-status/${encodeURIComponent(occ)}`,
  gymStatus: (occ: string) => `/gym-status/${encodeURIComponent(occ)}`,
  success: (occ: string) => `/result/success?occ=${encodeURIComponent(occ)}`,
  pending: (occ: string) => `/result/pending?occ=${encodeURIComponent(occ)}`,
  rejected: (occ: string) => `/result/rejected?occ=${encodeURIComponent(occ)}`,
  missed: (occ: string) => `/missed/${encodeURIComponent(occ)}`,
  runFailed: (occ: string) => `/run-failed/${encodeURIComponent(occ)}`,
  gymFailed: (occ: string) => `/gym-failed/${encodeURIComponent(occ)}`,
  dispute: (occ: string) => `/dispute/${encodeURIComponent(occ)}`,
  disputeSubmitted: (dp: string) => `/dispute/submitted?dp=${dp}`,
  disputeResult: (dp: string) => `/dispute/result?dp=${dp}`,
  paymentFailed: '/payment-failed',
  promise: (id: string) => `/promise/${id}`,
  pause: (id: string) => `/promise/${id}/pause`,
  watcher: (id: string) => `/promise/${id}/watcher`,
  watcherMessage: (id: string) => `/promise/${id}/watcher-message`,
  watcherConnected: (id: string) => `/promise/${id}/watcher-connected`,
  endPromise: (id: string) => `/promise/${id}/end`,
  account: '/account',
  notifications: '/account/notifications',
  support: '/account/support',
  withdraw: '/account/withdraw',
  payments: '/account/payments',
  pro: '/pro',
  dev: '/dev',
  gallery: '/dev/gallery',
} as const;

/** 약속 종류에 맞는 인증 화면 */
export function verifyHref(p: PromiseT, o: Occurrence) {
  if (p.method === 'strava') return href.runStatus(o.id);
  if (p.method === 'location') return href.gymStatus(o.id);
  return href.camera(o.id);
}

/** 알림을 눌렀을 때 열릴 화면 */
export function eventHref(e: AppEvent, d: Data): string | null {
  const o = e.occurrenceId ? d.occurrences[e.occurrenceId] : undefined;
  const p = e.promiseId ? d.promises[e.promiseId] : undefined;
  switch (e.type) {
    case 'missed':
      return o ? href.missed(o.id) : null;
    case 'auto_failed':
      if (!o || !p) return null;
      return p.method === 'strava' ? href.runFailed(o.id) : href.gymFailed(o.id);
    case 'review_done':
      if (!o) return null;
      return o.status === 'kept' ? href.success(o.id) : href.missed(o.id);
    case 'dispute_result':
      return e.disputeId ? href.disputeResult(e.disputeId) : null;
    case 'payment_failed':
      return href.paymentFailed;
    case 'watcher_connected':
      return p ? href.watcherConnected(p.id) : null;
    default:
      return null;
  }
}
