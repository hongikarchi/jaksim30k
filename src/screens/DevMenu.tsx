/**
 * 개발 메뉴: 가짜 서버를 조작해 MVP 흐름을 빠르게 시험한다.
 * 시간 이동, 판정·검수·이의제기·결제 결과, 자동 인증 기록, 예시 데이터.
 */
import { router } from 'expo-router';
import { Alert, Platform, View } from 'react-native';

import {
  Button,
  Card,
  Header,
  ListCard,
  PillButton,
  Screen,
  SectionLabel,
  Segmented,
  SettingRow,
  Text,
  Toggle,
} from '../components';
import { SCENARIOS, buildScenario, type ScenarioName } from '../dev/scenarios';
import { DAY, HOUR, KIND_NAMES, clock, dayLabel, whenLabel } from '../domain/rules';
import type { DevSettings } from '../domain/types';
import { href } from '../lib/routes';
import { go, goHome } from '../lib/nav';
import { useNow, useStore } from '../store';

const AI_LABELS: Record<DevSettings['aiResult'], string> = { pass: '통과', unclear: '애매', fail: '불통과', random: '무작위' };

function confirm(msg: string, onOk: () => void) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (globalThis.confirm?.(msg) ?? true) onOk();
    return;
  }
  Alert.alert('확인', msg, [{ text: '취소', style: 'cancel' }, { text: '확인', style: 'destructive', onPress: onOk }]);
}

export default function DevMenu() {
  const now = useNow();
  const s = useStore();
  const dev = s.dev;
  const act = s.devActions;

  const occ = Object.values(s.occurrences);
  const next = occ.filter((o) => o.status === 'upcoming' && o.start > now).sort((a, b) => a.start - b.start)[0];
  const openOnes = occ.filter((o) => now >= o.start && now < o.end && ['open', 'rejected'].includes(o.status));
  const runs = openOnes.filter((o) => s.promises[o.promiseId]?.method === 'strava');
  const gyms = openOnes.filter((o) => s.promises[o.promiseId]?.method === 'location');
  const invited = Object.values(s.promises).filter((p) => p.watcher?.status === 'invited');
  const reviewing = Object.values(s.submissions).filter((x) => x.reviewDueAt && !x.review).length;
  const disputing = Object.values(s.disputes).filter((x) => x.status === 'reviewing').length;

  return (
    <Screen scroll gap={12}>
      <Header onBack={() => (router.canGoBack() ? router.back() : goHome())} title="개발 메뉴" />
      <Card>
        <Text size={13} color="text3">
          앱 안의 지금
        </Text>
        <Text size={20} weight="bold">
          {dayLabel(now)} {clock(now)}
        </Text>
        <Text size={12} color="text3">
          {s.devOffset === 0 ? '실제 시각과 같아요' : `실제 시각보다 ${Math.round(s.devOffset / 60000)}분 ${s.devOffset > 0 ? '뒤' : '앞'}`}
        </Text>
      </Card>

      <SectionLabel>시간 이동</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {[
          ['+10분', 10 * 60_000],
          ['+1시간', HOUR],
          ['+6시간', 6 * HOUR],
          ['+12시간', 12 * HOUR],
          ['+1일', DAY],
        ].map(([label, ms]) => (
          <PillButton key={label as string} label={label as string} onPress={() => act.travel(ms as number)} />
        ))}
      </View>
      <ListCard>
        <SettingRow
          label="다음 인증 창이 열리는 순간으로"
          description={next ? `${KIND_NAMES[s.promises[next.promiseId].kind]} · ${whenLabel(next.start, now)}` : '예정된 창이 없어요'}
          onPress={next ? () => act.travelTo(next.start + 5_000) : undefined}
        />
        <SettingRow
          label="열린 창이 닫힌 직후로"
          description={openOnes[0] ? `${KIND_NAMES[s.promises[openOnes[0].promiseId].kind]} · ${clock(openOnes[0].end)} 마감` : '열린 창이 없어요'}
          onPress={openOnes[0] ? () => act.travelTo(openOnes[0].end + 5_000) : undefined}
        />
        <SettingRow label="실제 시각으로 되돌리기" description="앞으로 옮긴 시간만 되돌려요" onPress={act.resetTime} last />
      </ListCard>

      <SectionLabel>판정·결제 결과</SectionLabel>
      <Card style={{ gap: 14 }}>
        <View style={{ gap: 8 }}>
          <Text size={14} weight="semibold">
            AI 1차 판정
          </Text>
          <Segmented
            options={['pass', 'unclear', 'fail', 'random'] as DevSettings['aiResult'][]}
            value={dev.aiResult}
            onChange={(v) => act.set({ aiResult: v })}
            format={(v) => AI_LABELS[v]}
          />
        </View>
        <View style={{ gap: 8 }}>
          <Text size={14} weight="semibold">
            사람 검수 결과
          </Text>
          <Segmented
            options={['pass', 'miss'] as ('pass' | 'miss')[]}
            value={dev.reviewResult}
            onChange={(v) => act.set({ reviewResult: v })}
            format={(v) => (v === 'pass' ? '지킴' : '놓침')}
          />
        </View>
        <View style={{ gap: 8 }}>
          <Text size={14} weight="semibold">
            이의제기 검토 결과
          </Text>
          <Segmented
            options={['approve', 'deny'] as ('approve' | 'deny')[]}
            value={dev.disputeResult}
            onChange={(v) => act.set({ disputeResult: v })}
            format={(v) => (v === 'approve' ? '승인' : '거절')}
          />
        </View>
        <Row label="다음 결제 실패시키기" on={dev.nextChargeFails} onPress={() => act.set({ nextChargeFails: !dev.nextChargeFails })} />
        <Row label="다음 사진 업로드 실패시키기" on={dev.nextUploadFails} onPress={() => act.set({ nextUploadFails: !dev.nextUploadFails })} />
      </Card>
      <ListCard>
        <SettingRow label="검수 결과 지금 내기" description={`검수 중 ${reviewing}건`} onPress={reviewing ? act.resolveReviews : undefined} />
        <SettingRow label="이의제기 결과 지금 내기" description={`검토 중 ${disputing}건`} onPress={disputing ? act.resolveDisputes : undefined} last />
      </ListCard>

      <SectionLabel>자동 인증 기록 보내기</SectionLabel>
      <Card style={{ gap: 10 }}>
        {runs.length === 0 && gyms.length === 0 ? (
          <Text size={14} color="text3">
            지금 열린 러닝·헬스장 위치 인증 창이 없어요
          </Text>
        ) : null}
        {runs.map((o) => (
          <View key={o.id} style={{ gap: 8 }}>
            <Text size={14} weight="semibold">
              러닝 · {clock(o.end)} 마감
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <PillButton label="5.2km 달림" onPress={() => act.addRun(o.id, 5.2)} />
              <PillButton label="3.2km 달림" onPress={() => act.addRun(o.id, 3.2)} />
              <PillButton label="수동 입력 6km" onPress={() => act.addRun(o.id, 6, true)} />
            </View>
          </View>
        ))}
        {gyms.map((o) => (
          <View key={o.id} style={{ gap: 8 }}>
            <Text size={14} weight="semibold">
              헬스장 · 머문 시간 {o.auto?.stayedMin ?? 0}분
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <PillButton label="+10분 머묾" onPress={() => act.addStay(o.id, 10)} />
              <PillButton label="+30분 머묾" onPress={() => act.addStay(o.id, 30)} />
            </View>
          </View>
        ))}
      </Card>

      {invited.length ? (
        <>
          <SectionLabel>감시자</SectionLabel>
          <ListCard>
            {invited.map((p, i) => (
              <SettingRow
                key={p.id}
                label={`${p.watcher!.name}님이 초대 수락`}
                description={KIND_NAMES[p.kind]}
                action={<PillButton label="수락" onPress={() => act.connectWatcher(p.id)} />}
                last={i === invited.length - 1}
              />
            ))}
          </ListCard>
        </>
      ) : null}

      <SectionLabel>예시 데이터로 바꾸기</SectionLabel>
      <ListCard>
        {(Object.keys(SCENARIOS) as ScenarioName[]).map((k, i, all) => (
          <SettingRow
            key={k}
            label={SCENARIOS[k]}
            last={i === all.length - 1}
            onPress={() =>
              confirm('지금 데이터를 지우고 예시 데이터로 바꿀까요?', () => {
                useStore.setState(buildScenario(k));
                if (k === 'new') router.replace(href.welcome as never);
                else goHome();
              })
            }
          />
        ))}
      </ListCard>

      <ListCard>
        <SettingRow label="화면 갤러리" description="51개 화면을 번호순으로 모아 봐요" onPress={() => go(href.gallery)} last />
      </ListCard>

      <Button
        label="모든 데이터 지우기"
        variant="secondary"
        onPress={() =>
          confirm('로그인과 약속, 기록을 모두 지울까요?', () => {
            act.reset();
            router.replace(href.welcome as never);
          })
        }
      />
    </Screen>
  );
}

function Row({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text size={14} weight="semibold">
        {label}
      </Text>
      <Toggle on={on} onPress={onPress} />
    </View>
  );
}
