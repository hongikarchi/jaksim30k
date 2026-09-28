import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DAY, HOUR, monthKey, parseDateKey, pauseLimit, presetSchedule } from '../domain/rules';
import type {
  AiResult,
  Charge,
  DevSettings,
  DisputeReason,
  Draft,
  NotificationSettings,
  PromiseKind,
  PromiseT,
  Schedule,
  Submission,
  Watcher,
} from '../domain/types';
import { initialData, type Data } from './data';
import {
  DISPUTE_REVIEW_HOURS,
  REVIEW_HOURS,
  RUN_MIN_KM,
  attemptCharge,
  generateOccurrences,
  markKept,
  markMissed,
  newId,
  pushEvent,
  regenerateFuture,
  resolveDispute,
  tick,
} from './engine';

export { initialData, type Data } from './data';

/** 앱 안의 "지금" (개발용 시간 이동 포함) */
export const nowOf = (d: Pick<Data, 'devOffset'>) => Date.now() + d.devOffset;

type Actions = {
  /** 시간 흐름 처리 */
  tick: () => void;

  login: (provider: 'kakao' | 'apple') => { isNew: boolean };
  grantPermissions: (p: Partial<{ notifications: boolean; camera: boolean; location: boolean }>) => void;
  logout: () => void;
  withdraw: () => void;

  startDraft: (kind: PromiseKind) => void;
  updateDraft: (patch: Partial<Draft>) => void;
  createPromise: () => string | null;
  updatePromise: (id: string, patch: { schedule?: Schedule; maxAmount?: number }) => void;
  pauseDays: (promiseId: string, occurrenceIds: string[]) => { ok: boolean; reason?: string };
  endPromise: (id: string) => void;
  setWatcher: (promiseId: string, w: Pick<Watcher, 'name' | 'scope'>) => void;
  removeWatcher: (promiseId: string) => void;
  /** 연결 상태는 그대로 두고 알림 범위만 바꾼다 */
  updateWatcherScope: (promiseId: string, scope: Watcher['scope']) => void;

  registerCard: (company: string) => void;

  /** 사진 제출. uploaded가 false면 업로드 실패(제출 실패 화면에서 retryUpload로 다시 보낸다) */
  submitPhoto: (
    occurrenceId: string,
    input: { uri?: string; takenAt: number; book?: { title: string; line: string } },
  ) => { id: string; uploaded: boolean } | null;
  retryUpload: (submissionId: string) => boolean;
  /** AI 1차 판정 (가짜) */
  judge: (submissionId: string) => AiResult;
  fileDispute: (occurrenceId: string, reason: DisputeReason, note: string) => string;

  connectStrava: () => void;
  startPro: (plan: 'month' | 'year') => void;
  cancelPro: () => void;
  updateSettings: (patch: Partial<NotificationSettings>) => void;
  markSeen: (eventId: string) => void;
  markAllSeen: () => void;

  devActions: {
    set: (patch: Partial<DevSettings>) => void;
    travel: (ms: number) => void;
    travelTo: (t: number) => void;
    resetTime: () => void;
    resolveReviews: () => void;
    resolveDisputes: () => void;
    addRun: (occurrenceId: string, km: number, manual?: boolean) => void;
    addStay: (occurrenceId: string, minutes: number) => void;
    connectWatcher: (promiseId: string) => void;
    reset: () => void;
  };
};

export type Store = Data & Actions;

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      /** 데이터를 복사해 고친 뒤 한 번에 반영 */
      const mutate = <R,>(fn: (d: Data, now: number) => R): R => {
        const s = get();
        const d = clone(pick(s));
        const now = nowOf(d);
        const r = fn(d, now);
        tick(d, now);
        set(d);
        return r;
      };

      return {
        ...initialData(),

        tick: () => {
          const s = get();
          if (!s.user) return;
          const before = JSON.stringify(pick(s));
          const d = JSON.parse(before) as Data;
          tick(d, nowOf(d));
          if (JSON.stringify(d) !== before) set(d);
        },

        login: (provider) =>
          mutate((d, now) => {
            const isNew = !d.user;
            d.signedOut = false;
            if (!d.user)
              d.user = {
                provider,
                name: provider === 'kakao' ? '카카오 사용자' : 'Apple 사용자',
                createdAt: now,
                permissions: { notifications: false, camera: false, location: false },
                pro: { status: 'free' },
                stravaConnected: false,
              };
            return { isNew };
          }),

        grantPermissions: (p) =>
          mutate((d) => {
            if (d.user) d.user.permissions = { ...d.user.permissions, ...p };
          }),

        logout: () => set({ signedOut: true }),

        withdraw: () => {
          // 결제 예정 금액은 먼저 결제하고 모든 데이터를 지운다 (SPEC 2.6)
          mutate((d, now) => {
            for (const c of Object.values(d.charges)) if (c.status === 'scheduled') attemptCharge(d, c, now);
          });
          set({ ...initialData() });
        },

        startDraft: (kind) =>
          set({
            draft: {
              kind,
              schedule: presetSchedule(kind),
              method: kind === 'run' ? 'strava' : 'photo',
              maxAmount: 30000,
              gym: kind === 'gym' ? { placeName: '', stayMinutes: 30 } : undefined,
              room: kind === 'room' ? { checklist: [] } : undefined,
            },
          }),

        updateDraft: (patch) => {
          const dr = get().draft;
          if (dr) set({ draft: { ...dr, ...patch } });
        },

        createPromise: () =>
          mutate((d, now) => {
            const dr = d.draft;
            if (!dr || !d.card) return null;
            const p: PromiseT = {
              id: newId('pr'),
              kind: dr.kind,
              schedule: dr.schedule,
              method: dr.method,
              maxAmount: dr.maxAmount,
              missCount: 0,
              status: 'active',
              createdAt: now,
              gym: dr.gym,
              room: dr.room,
              pausesByMonth: {},
            };
            d.promises[p.id] = p;
            d.draft = null;
            generateOccurrences(d, p, now);
            return p.id;
          }),

        updatePromise: (id, patch) =>
          mutate((d, now) => {
            const p = d.promises[id];
            if (!p) return;
            if (patch.maxAmount) p.maxAmount = patch.maxAmount;
            if (patch.schedule) {
              p.schedule = patch.schedule;
              regenerateFuture(d, p, now);
            }
          }),

        pauseDays: (promiseId, ids) =>
          mutate((d, now) => {
            const p = d.promises[promiseId];
            const pro = d.user?.pro.status !== 'free';
            const limit = pauseLimit(pro);
            const byMonth: Record<string, number> = {};
            for (const id of ids) {
              const o = d.occurrences[id];
              if (!o || o.end <= now || !['upcoming', 'open'].includes(o.status))
                return { ok: false, reason: '이미 지난 날은 쉴 수 없어요' };
              const mk = monthKey(parseDateKey(o.date));
              byMonth[mk] = (byMonth[mk] ?? 0) + 1;
            }
            for (const [mk, n] of Object.entries(byMonth))
              if ((p.pausesByMonth[mk] ?? 0) + n > limit)
                return { ok: false, reason: `한 달에 ${limit}번까지 쉴 수 있어요` };
            for (const id of ids) d.occurrences[id].status = 'paused';
            for (const [mk, n] of Object.entries(byMonth)) p.pausesByMonth[mk] = (p.pausesByMonth[mk] ?? 0) + n;
            return { ok: true };
          }),

        endPromise: (id) =>
          mutate((d, now) => {
            const p = d.promises[id];
            if (!p) return;
            p.status = 'ended';
            p.endedAt = now;
            // 이후 결제 없음: 앞으로 올 창과 아직 판정 전인 창을 지운다
            for (const o of Object.values(d.occurrences))
              if (o.promiseId === id && ['upcoming', 'open', 'rejected'].includes(o.status)) delete d.occurrences[o.id];
          }),

        setWatcher: (promiseId, w) =>
          mutate((d, now) => {
            const p = d.promises[promiseId];
            if (p) p.watcher = { ...w, status: 'invited', invitedAt: now };
          }),

        removeWatcher: (promiseId) =>
          mutate((d) => {
            const p = d.promises[promiseId];
            if (p) delete p.watcher;
          }),

        updateWatcherScope: (promiseId, scope) =>
          mutate((d) => {
            const w = d.promises[promiseId]?.watcher;
            if (w) w.scope = scope;
          }),

        registerCard: (company) =>
          mutate((d, now) => {
            d.card = { company, last4: String(1000 + Math.floor(Math.random() * 9000)), registeredAt: now };
            // 카드 등록 성공 시 밀린 금액 즉시 결제 (SPEC 2.3)
            for (const c of Object.values(d.charges)) if (c.status === 'failed') attemptCharge(d, c, now);
            if (!Object.values(d.charges).some((c) => c.status === 'failed')) d.paymentFailedAt = undefined;
          }),

        submitPhoto: (occurrenceId, input) =>
          mutate((d, now) => {
            const o = d.occurrences[occurrenceId];
            if (!o) return null;
            const s: Submission = {
              id: newId('sb'),
              occurrenceId,
              uri: input.uri,
              takenAt: input.takenAt,
              mission: o.mission,
              book: input.book,
            };
            d.submissions[s.id] = s;
            o.submissionIds.push(s.id);
            if (input.book?.title && !d.books.includes(input.book.title)) d.books.unshift(input.book.title);
            if (d.dev.nextUploadFails) {
              d.dev.nextUploadFails = false;
              s.uploadFailed = true;
              return { id: s.id, uploaded: false };
            }
            s.submittedAt = now;
            o.status = 'judging';
            return { id: s.id, uploaded: true };
          }),

        retryUpload: (submissionId) =>
          mutate((d, now) => {
            const s = d.submissions[submissionId];
            if (!s) return false;
            const o = d.occurrences[s.occurrenceId];
            s.uploadFailed = false;
            s.submittedAt = now;
            // 촬영 시각이 창 안이면 늦게 보내도 인정
            if (s.takenAt >= o.start && s.takenAt < o.end && !['kept', 'missed'].includes(o.status)) o.status = 'judging';
            return true;
          }),

        judge: (submissionId) =>
          mutate((d, now) => {
            const s = d.submissions[submissionId];
            const o = d.occurrences[s.occurrenceId];
            const pick = d.dev.aiResult;
            const r: AiResult =
              pick === 'random' ? (['pass', 'pass', 'unclear', 'fail'] as const)[Math.floor(Math.random() * 4)] : pick;
            s.ai = r;
            if (r === 'pass') {
              s.aiReason = '미션이 잘 보여요';
              markKept(d, o, s.takenAt);
            } else if (r === 'unclear') {
              s.aiReason = '사진이 조금 어두워요';
              s.reviewDueAt = now + REVIEW_HOURS * HOUR;
              o.status = 'reviewing';
            } else {
              s.aiReason = o.mission?.includes('손') ? '손이 화면에 보이지 않아요' : '미션을 확인할 수 없어요';
              if (now < o.end) o.status = 'rejected';
              else markMissed(d, o, now);
            }
            return r;
          }),

        fileDispute: (occurrenceId, reason, note) =>
          mutate((d, now) => {
            const o = d.occurrences[occurrenceId];
            const id = newId('dp');
            d.disputes[id] = {
              id,
              occurrenceId,
              reason,
              note,
              status: 'reviewing',
              createdAt: now,
              dueAt: now + DISPUTE_REVIEW_HOURS * HOUR,
            };
            o.disputeId = id;
            // 다시 찍기 화면에서 낸 이의제기: 아직 놓침 확정 전이면 먼저 놓침 처리 후 검토
            if (o.status === 'rejected') markMissed(d, o, now);
            // 앱·카메라 오류는 확인 없이 즉시 승인 (SPEC 2.4)
            if (reason === 'app_error') resolveDispute(d, id, true, now);
            else if (o.chargeId && d.charges[o.chargeId].status === 'scheduled') d.charges[o.chargeId].status = 'held';
            return id;
          }),

        connectStrava: () =>
          mutate((d) => {
            if (d.user) d.user.stravaConnected = true;
          }),

        startPro: (plan) =>
          mutate((d, now) => {
            if (!d.user) return;
            const usedTrial = !!d.user.pro.startedAt;
            d.user.pro = usedTrial
              ? { status: 'pro', plan, startedAt: now, renewsAt: now + (plan === 'year' ? 365 : 30) * DAY }
              : { status: 'trial', plan, startedAt: now, trialEndsAt: now + 7 * DAY };
          }),

        cancelPro: () =>
          mutate((d) => {
            if (d.user) d.user.pro = { status: 'free', startedAt: d.user.pro.startedAt };
          }),

        updateSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),

        markSeen: (eventId) =>
          set({ events: get().events.map((e) => (e.id === eventId ? { ...e, seen: true } : e)) }),
        markAllSeen: () => set({ events: get().events.map((e) => ({ ...e, seen: true })) }),

        devActions: {
          set: (patch) => set({ dev: { ...get().dev, ...patch } }),
          travel: (ms) => mutate((d) => void (d.devOffset += ms)),
          travelTo: (t) => mutate((d) => void (d.devOffset = t - Date.now())),
          resetTime: () => mutate((d) => void (d.devOffset = Math.min(0, d.devOffset))),
          resolveReviews: () =>
            mutate((d, now) => {
              for (const s of Object.values(d.submissions)) if (s.reviewDueAt && !s.review) s.reviewDueAt = now;
            }),
          resolveDisputes: () =>
            mutate((d, now) => {
              for (const dp of Object.values(d.disputes)) if (dp.status === 'reviewing') dp.dueAt = now;
            }),
          addRun: (occurrenceId, km, manual) =>
            mutate((d, now) => {
              const o = d.occurrences[occurrenceId];
              if (!o || !['open', 'upcoming'].includes(o.status)) return;
              o.auto = { ...o.auto, distanceKm: km, manual, activityAt: now };
              if (!manual && km >= RUN_MIN_KM && now >= o.start && now < o.end) markKept(d, o, now);
            }),
          addStay: (occurrenceId, minutes) =>
            mutate((d, now) => {
              const o = d.occurrences[occurrenceId];
              const p = o && d.promises[o.promiseId];
              if (!o || !p || !['open', 'upcoming'].includes(o.status)) return;
              const stayed = (o.auto?.stayedMin ?? 0) + minutes;
              o.auto = { ...o.auto, stayedMin: stayed, activityAt: now, arrivedAt: o.auto?.arrivedAt ?? now };
              if (stayed >= (p.gym?.stayMinutes ?? 30) && now >= o.start && now < o.end) markKept(d, o, now);
            }),
          connectWatcher: (promiseId) =>
            mutate((d, now) => {
              const w = d.promises[promiseId]?.watcher;
              if (!w) return;
              w.status = 'connected';
              w.connectedAt = now;
              pushEvent(d, 'watcher_connected', now, { promiseId });
            }),
          reset: () => set({ ...initialData() }),
        },
      };
    },
    {
      name: 'jaksim30k',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => pick(s),
    },
  ),
);

/** 스토어에서 데이터 부분만 */
function pick(s: Store): Data {
  return {
    version: s.version,
    devOffset: s.devOffset,
    user: s.user,
    signedOut: s.signedOut,
    card: s.card,
    promises: s.promises,
    occurrences: s.occurrences,
    submissions: s.submissions,
    disputes: s.disputes,
    charges: s.charges,
    events: s.events,
    settings: s.settings,
    dev: s.dev,
    paymentFailedAt: s.paymentFailedAt,
    draft: s.draft,
    books: s.books,
  };
}

/** 저장된 데이터를 다 불러왔는지 */
export function useHydrated() {
  const [h, setH] = useState(useStore.persist.hasHydrated());
  useEffect(() => {
    const un = useStore.persist.onFinishHydration(() => setH(true));
    setH(useStore.persist.hasHydrated());
    return un;
  }, []);
  return h;
}

/** 1초마다 바뀌는 "지금" */
export function useNow(intervalMs = 1000) {
  const offset = useStore((s) => s.devOffset);
  const [t, setT] = useState(() => Date.now() + offset);
  useEffect(() => {
    setT(Date.now() + offset);
    const id = setInterval(() => setT(Date.now() + offset), intervalMs);
    return () => clearInterval(id);
  }, [offset, intervalMs]);
  return t;
}

export type { Charge };
