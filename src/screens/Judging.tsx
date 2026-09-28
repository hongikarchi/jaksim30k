/** 27. 판정 중: 제출 직후. 잠시 뒤 AI 판정을 한 번 돌리고 결과 화면으로 넘어간다 */
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, ClockCard, Dots, PhotoCard, Screen, Text } from '../components';
import { hms } from '../domain/rules';
import type { AiResult } from '../domain/types';
import { href } from '../lib/routes';
import { goHome, replace } from '../lib/nav';
import { useNow, useStore, type Data } from '../store';
import { promiseTitle } from '../store/selectors';
import { colors } from '../theme';
import { markOccEventsSeen, param } from './VerifyShared';

/** 판정 시간 연출 */
const JUDGE_DELAY_MS = 1800;

export function JudgingView({ name, uri, now, end }: { name: string; uri?: string; now: number; end: number }) {
  return (
    <Screen topGap="wide" gap={16} footer={<Button label="확인 중…" disabled />}>
      <ClockCard
        label="남은 시간"
        name={name}
        digits={hms(end - now)}
        title="미션 완료 여부를 판정하고 있어요"
        subtitle="보통 몇 초면 끝나요"
      />
      <PhotoCard uri={uri} placeholder="방금 찍은 사진" />
      <View style={styles.info}>
        <Dots />
        <Text size={14} color="textBody" body style={{ flex: 1 }}>
          판정이 끝나면 바로 결과 화면으로 넘어가요.
        </Text>
      </View>
    </Screen>
  );
}

/** 판정 결과 → 다음 화면 */
export function resultHref(d: Data, subId: string, ai: AiResult) {
  const s = d.submissions[subId];
  const o = s && d.occurrences[s.occurrenceId];
  if (!o) return href.home;
  if (o.status === 'missed') return href.missed(o.id);
  if (ai === 'pass' || o.status === 'kept' || o.status === 'excused') return href.success(o.id);
  if (ai === 'unclear') return href.pending(o.id);
  return href.rejected(o.id);
}

export default function JudgingRoute() {
  const subId = param(useLocalSearchParams<{ sub: string }>().sub);
  const now = useNow();
  const s = useStore((d) => d.submissions[subId]);
  const o = useStore((d) => (s ? d.occurrences[s.occurrenceId] : undefined));
  const p = useStore((d) => (o ? d.promises[o.promiseId] : undefined));
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    const cur = useStore.getState().submissions[subId];
    if (!cur) return;
    started.current = true;
    // 이미 판정된 제출이면 다시 판정하지 않고 결과로 보낸다
    if (cur.ai) {
      replace(resultHref(useStore.getState(), subId, cur.ai));
      return;
    }
    const t = setTimeout(() => {
      const st = useStore.getState();
      const again = st.submissions[subId];
      const ai = again?.ai ?? st.judge(subId);
      const after = useStore.getState();
      const to = resultHref(after, subId, ai);
      // 창이 닫힌 뒤 불통과로 놓친 날이 되면 바로 놓친 날 화면으로 가니, 같은 알림은 본 것으로
      if (again) markOccEventsSeen(after, again.occurrenceId, ['missed']);
      replace(to);
    }, JUDGE_DELAY_MS);
    // 화면을 떠나면 판정을 멈추고 다음에 다시 시도한다
    return () => {
      clearTimeout(t);
      started.current = false;
    };
  }, [subId, !!s]);

  if (!s || !o || !p) {
    return (
      <Screen topGap="wide" footer={<Button label="홈으로" onPress={goHome} />}>
        <Text size={20} weight="bold" tight>
          제출한 사진을 찾을 수 없어요
        </Text>
      </Screen>
    );
  }

  return <JudgingView name={promiseTitle(p)} uri={s.uri} now={now} end={o.end} />;
}

const styles = StyleSheet.create({
  info: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
});
