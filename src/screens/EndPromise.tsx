/** 45. 약속 끝내기: 기록을 먼저 보여주고 쉬어가기·금액 낮추기·시간 바꾸기를 먼저 제안 (SPEC 2.5) */
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';

import {
  BottomActions,
  Button,
  DotText,
  Header,
  Icon,
  InfoCard,
  Led,
  Screen,
  Text,
  TextButton,
} from '../components';
import { won } from '../domain/rules';
import { href } from '../lib/routes';
import { go, goHome } from '../lib/nav';
import { colors } from '../theme';
import type { Data } from '../store';
import { useNow, useStore } from '../store';
import { streakOf } from '../store/engine';
import { occurrencesOf, promiseTitle } from '../store/selectors';

export type EndPromiseModel = {
  id: string;
  name: string;
  streak: number;
  /** 지금까지 지킨 날 */
  kept: number;
  /** 지금까지 낸 금액 */
  paid: number;
};

export function buildEndPromiseModel(d: Data, id: string, now: number): EndPromiseModel | null {
  const p = d.promises[id];
  if (!p) return null;
  return {
    id,
    name: promiseTitle(p),
    streak: streakOf(d, id, now),
    kept: occurrencesOf(d, id).filter((o) => o.status === 'kept' || o.status === 'excused').length,
    paid: Object.values(d.charges)
      .filter((c) => c.promiseId === id && c.status === 'paid')
      .reduce((a, c) => a + c.amount, 0),
  };
}

export function EndPromiseView({
  model: m,
  onBack,
  onNavigate,
  onEnd,
}: {
  model: EndPromiseModel;
  onBack: () => void;
  onNavigate: (to: string) => void;
  onEnd: () => void;
}) {
  const alternatives = [
    { label: '잠깐 쉬어가기', description: '기록은 그대로, 정한 날만 쉬어요', to: href.pause(m.id) },
    { label: '금액 낮추기', description: '부담이 크다면 최대 금액을 줄여요', to: `${href.promise(m.id)}?sheet=stake` },
    { label: '인증 시간 바꾸기', description: '시간이 안 맞는다면 옮겨요', to: `${href.promise(m.id)}?sheet=time` },
  ];
  return (
    <Screen
      scroll
      gap={12}
      footer={
        <View style={{ gap: 8 }}>
          <TextButton label="그래도 끝낼게요" color="text3" onPress={onEnd} />
          <BottomActions>
            <Button label="계속 지킬게요" onPress={onBack} />
          </BottomActions>
        </View>
      }
    >
      <Header onBack={onBack} />
      <View style={{ gap: 16, padding: 24, borderRadius: 28, backgroundColor: colors.ink }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text size={13} weight="semibold" color="textOnInk">
            연속으로 지킨 날
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Led state="on" size={8} />
            <Text size={13} color="surface">
              {m.name}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
          <DotText size={75} color="signal">
            {m.streak}
          </DotText>
          <Text size={20} weight="bold" color="surface">
            일째
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 20 }}>
          <Record label="지금까지 지킨 날" value={`${m.kept}일`} />
          <Record label="지금까지 낸 금액" value={won(m.paid)} />
        </View>
        <View style={{ gap: 4 }}>
          <Text size={20} weight="bold" color="surface" tight>
            정말 여기서 멈출까요?
          </Text>
          <Text size={14} color="textOnInk">
            끝내면 이 기록도 여기서 멈춰요
          </Text>
        </View>
      </View>
      <Text size={13} weight="semibold" color="text2" style={{ paddingTop: 6, paddingHorizontal: 4 }}>
        끝내기 전에, 이런 방법도 있어요
      </Text>
      <View style={{ paddingVertical: 4, paddingHorizontal: 20, borderRadius: 22, backgroundColor: colors.surface }}>
        {alternatives.map((a, i) => (
          <Pressable
            key={a.label}
            accessibilityRole="button"
            onPress={() => onNavigate(a.to)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              minHeight: 54,
              borderBottomWidth: i < alternatives.length - 1 ? 1 : 0,
              borderBottomColor: colors.lineOnSurface,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View style={{ gap: 2, flex: 1 }}>
              <Text size={15} weight="semibold">
                {a.label}
              </Text>
              <Text size={12} color="text3">
                {a.description}
              </Text>
            </View>
            <Icon name="chevronRight" size={16} color={colors.text2} />
          </Pressable>
        ))}
      </View>
      <InfoCard icon="info">끝내면 바로 멈추고, 이 약속으로는 더 이상 결제되지 않아요.</InfoCard>
    </Screen>
  );
}

function Record({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text size={12} color="textOnInk">
        {label}
      </Text>
      <Text size={15} weight="semibold" color="surface">
        {value}
      </Text>
    </View>
  );
}

export default function EndPromiseRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const now = useNow();
  const state = useStore();
  const model = buildEndPromiseModel(state, id, now);
  if (!model) return null;
  return (
    <EndPromiseView
      model={model}
      onBack={() => router.back()}
      onNavigate={go}
      onEnd={() => {
        state.endPromise(id);
        goHome();
      }}
    />
  );
}
