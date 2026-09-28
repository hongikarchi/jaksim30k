import { buildScenario } from '../scenarios';
import { AccountView } from '../../screens/Account';
import { NotificationSettingsView } from '../../screens/NotificationSettings';
import { buildPaymentsModel, PaymentsView } from '../../screens/Payments';
import { ProView } from '../../screens/Pro';
import { SupportView } from '../../screens/Support';
import { WithdrawView } from '../../screens/Withdraw';
import { DAY } from '../../domain/rules';
import { initialData, nowOf } from '../../store';
import type { Data } from '../../store';
import { noop, type GalleryEntry } from './types';

/** 2026-09-28(월) 22:17 */
const NOW = new Date(2026, 8, 28, 22, 17, 50).getTime();

const payments = (name: 'waiting' | 'multi') => {
  const d = buildScenario(name) as Data;
  return buildPaymentsModel(d, nowOf(d));
};

const account = {
  name: '카카오 사용자',
  provider: 'kakao' as const,
  hasCard: true,
  cardLabel: '신한카드 •••• 4821',
  notifSummary: '시작 10분 전, 마감 5분 전',
};

export const entries: GalleryEntry[] = [
  {
    n: 46,
    title: '계정',
    render: () => (
      <AccountView model={{ ...account, pro: { status: 'free' } }} now={NOW} onBack={noop} onNavigate={noop} onLogout={noop} />
    ),
  },
  {
    n: 46,
    variant: '체험 중',
    title: '계정',
    render: () => (
      <AccountView
        model={{ ...account, pro: { status: 'trial', plan: 'month', startedAt: NOW - 2 * DAY, trialEndsAt: NOW + 5 * DAY } }}
        now={NOW}
        onBack={noop}
        onNavigate={noop}
        onLogout={noop}
      />
    ),
  },
  {
    n: 47,
    title: '알림 설정',
    render: () => (
      <NotificationSettingsView settings={initialData().settings} permission onBack={noop} onChange={noop} onRequestPermission={noop} />
    ),
  },
  {
    n: 47,
    variant: '권한 꺼짐',
    title: '알림 설정',
    render: () => (
      <NotificationSettingsView
        settings={{ ...initialData().settings, beforeOpen: false, deadlineMinutes: 10 }}
        permission={false}
        onBack={noop}
        onChange={noop}
        onRequestPermission={noop}
      />
    ),
  },
  { n: 48, title: '약관과 문의', render: () => <SupportView version="1.0.0" onBack={noop} /> },
  {
    n: 48,
    variant: '실패금 안내',
    title: '약관과 문의',
    render: () => <SupportView version="1.0.0" onBack={noop} initialDoc="실패금 안내" />,
  },
  {
    n: 48,
    variant: '문의 준비 중',
    title: '약관과 문의',
    render: () => <SupportView version="1.0.0" onBack={noop} initialContact />,
  },
  {
    n: 49,
    title: '회원 탈퇴',
    render: () => (
      <WithdrawView model={{ activeCount: 2, scheduledAmount: 5000, heldCount: 0 }} onBack={noop} onWithdraw={noop} />
    ),
  },
  {
    n: 49,
    variant: '확인함',
    title: '회원 탈퇴',
    render: () => (
      <WithdrawView model={{ activeCount: 2, scheduledAmount: 5000, heldCount: 1 }} initialChecked onBack={noop} onWithdraw={noop} />
    ),
  },
  { n: 50, title: '결제 내역', render: () => <PaymentsView model={payments('waiting')} onBack={noop} /> },
  {
    n: 50,
    variant: '프로·여러 상태',
    title: '결제 내역',
    render: () => (
      <PaymentsView
        model={{
          monthLabel: '9월',
          monthPaid: 5000,
          totalPaid: 15000,
          pro: true,
          groups: [
            {
              label: '9월',
              rows: [
                { id: 'a', name: '미라클모닝', detail: '9월 28일 놓침, 내일 06:10 결제 예정', amount: 10000, status: 'scheduled' },
                { id: 'b', name: '헬스장', detail: '9월 23일 놓침, 검토 중이라 결제 보류', amount: 10000, status: 'held' },
                { id: 'c', name: '미라클모닝', detail: '9월 3일 놓침, 9월 4일 결제', amount: 5000, status: 'paid' },
              ],
            },
            {
              label: '8월',
              rows: [
                { id: 'd', name: '미라클모닝', detail: '8월 27일 놓침, 이의제기로 취소', amount: 5000, status: 'canceled' },
                { id: 'e', name: '헬스장', detail: '8월 19일 놓침, 카드 결제 실패', amount: 10000, status: 'failed' },
                { id: 'f', name: '책읽기', detail: '8월 11일 놓침, 첫 연습', amount: 0, status: 'paid' },
              ],
            },
          ],
        }}
        onBack={noop}
      />
    ),
  },
  {
    n: 50,
    variant: '내역 없음',
    title: '결제 내역',
    render: () => <PaymentsView model={{ monthLabel: '9월', monthPaid: 0, totalPaid: 0, pro: false, groups: [] }} onBack={noop} />,
  },
  {
    n: 51,
    title: '프로 구독',
    render: () => <ProView pro={{ status: 'free' }} now={NOW} onBack={noop} onStart={noop} onCancel={noop} />,
  },
  {
    n: 51,
    variant: '체험 중',
    title: '프로 구독',
    render: () => (
      <ProView
        pro={{ status: 'trial', plan: 'month', startedAt: NOW - 2 * DAY, trialEndsAt: NOW + 5 * DAY }}
        now={NOW}
        onBack={noop}
        onStart={noop}
        onCancel={noop}
      />
    ),
  },
  {
    n: 51,
    variant: '구독 중',
    title: '프로 구독',
    render: () => (
      <ProView
        pro={{ status: 'pro', plan: 'year', startedAt: NOW - 20 * DAY, renewsAt: NOW + 345 * DAY }}
        now={NOW}
        onBack={noop}
        onStart={noop}
        onCancel={noop}
      />
    ),
  },
  {
    n: 51,
    variant: '체험 끝남',
    title: '프로 구독',
    render: () => <ProView pro={{ status: 'free', startedAt: NOW - 30 * DAY }} now={NOW} onBack={noop} onStart={noop} onCancel={noop} />,
  },
];
