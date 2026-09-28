/**
 * 기기 로컬 알림 (SPEC 6장). 진짜 서버 푸시가 생기기 전까지, 앱이 앞으로 열릴 인증 창을 보고
 * 알림을 미리 예약해 둔다. 데이터가 바뀔 때마다 전부 지우고 다시 예약한다.
 */
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { HOUR, KIND_NAMES, clock, isNarrow, won } from '../domain/rules';
import { useStore } from '../store';
import type { Data } from '../store';
import { stakeOf } from '../store/selectors';

const supported = Platform.OS !== 'web';

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestNotificationPermission() {
  if (!supported) return true;
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const res = await Notifications.requestPermissionsAsync();
  return res.granted;
}

type Planned = { at: number; title: string; body: string; url: string };

/** 앞으로 48시간 안의 알림 목록 */
export function planNotifications(d: Data, now: number): Planned[] {
  const out: Planned[] = [];
  const s = d.settings;
  for (const o of Object.values(d.occurrences)) {
    const p = d.promises[o.promiseId];
    if (!p || p.status !== 'active') continue;
    if (o.end < now || o.start > now + 48 * HOUR) continue;
    if (!['upcoming', 'open', 'rejected'].includes(o.status)) continue;
    const name = KIND_NAMES[p.kind];
    const amount = won(stakeOf(p));
    const narrow = isNarrow(o.start, o.end);
    const range = `${clock(o.start)}–${clock(o.end)}`;
    if (s.beforeOpen) {
      const m = s.beforeOpenMinutes;
      out.push({
        at: o.start - m * 60_000,
        title: `${m}분 뒤 ${name} 인증이 열려요`,
        body: `${range}, ${amount}이 걸려 있어요`,
        url: '/home',
      });
    }
    if (s.open && narrow)
      out.push({ at: o.start, title: '지금 인증하세요', body: `${clock(o.end)}에 닫혀요`, url: `/verify/${o.id}` });
    if (s.deadline) {
      const m = s.deadlineMinutes;
      out.push({
        at: o.end - m * 60_000,
        title: `${m}분 남았어요`,
        body: `지금 인증하지 않으면 ${amount}이 결제돼요`,
        url: p.method === 'photo' ? `/verify/${o.id}` : '/home',
      });
    }
    if (s.wideDeadline && !narrow)
      out.push({
        at: o.end - 3 * HOUR,
        title: `${name} 마감까지 3시간`,
        body: `오늘 ${clock(o.end)}까지 기록을 남겨주세요`,
        url: '/home',
      });
    // 놓친 날 알림은 끌 수 없다
    out.push({
      at: o.end + 1000,
      title: '오늘 약속을 놓쳤어요',
      body: `${amount}이 결제될 예정이에요. 억울하면 이의제기할 수 있어요`,
      url: '/home',
    });
  }
  return out.filter((n) => n.at > now + 5_000).sort((a, b) => a.at - b.at).slice(0, 40);
}

let timer: ReturnType<typeof setTimeout> | undefined;

async function sync(d: Data) {
  if (!supported || !d.user?.permissions.notifications) return;
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return;
  const now = Date.now() + d.devOffset;
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const n of planNotifications(d, now)) {
    await Notifications.scheduleNotificationAsync({
      content: { title: n.title, body: n.body, data: { url: n.url } },
      // 개발용 시간 이동을 빼서 실제 시각으로 예약
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(n.at - d.devOffset) },
    });
  }
}

/** 데이터가 바뀌면 알림을 다시 예약하고, 알림을 누르면 해당 화면으로 연다 */
export function NotificationSync() {
  const occurrences = useStore((s) => s.occurrences);
  const settings = useStore((s) => s.settings);
  const devOffset = useStore((s) => s.devOffset);
  const perm = useStore((s) => s.user?.permissions.notifications);

  useEffect(() => {
    if (!supported) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      sync(useStore.getState()).catch(() => {});
    }, 1500);
  }, [occurrences, settings, devOffset, perm]);

  useEffect(() => {
    if (!supported) return;
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const url = res.notification.request.content.data?.url;
      if (typeof url === 'string') router.push(url as never);
    });
    return () => sub.remove();
  }, []);

  return null;
}
