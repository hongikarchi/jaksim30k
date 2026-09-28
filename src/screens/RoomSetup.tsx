/** 9. 방청소 기준: 사진으로 확인할 수 있는 체크리스트 + 기준 사진 */
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { BottomActions, Button, Header, Icon, OptionCard, Screen, SectionLabel, Text, Title } from '../components';
import { href } from '../lib/routes';
import { go } from '../lib/nav';
import { useStore } from '../store';
import { colors } from '../theme';

/** 사진으로 확인할 수 있는 기준만 (SPEC 2.1) */
export const ROOM_CHECKLIST = [
  '바닥에 물건이 없다',
  '침대가 정리되어 있다',
  '책상 위 물건이 3개 이하다',
  '설거지통이 비어 있다',
  '빨래가 개어져 있다',
];

export function RoomSetupView({
  checklist,
  refPhotoUri,
  onToggle,
  onBack,
  onCamera,
  onNext,
}: {
  /** 고른 기준 */
  checklist: string[];
  refPhotoUri?: string;
  onToggle: (item: string) => void;
  onBack: () => void;
  /** 기준 사진 촬영으로 */
  onCamera: () => void;
  /** 금액 정하기로 */
  onNext: () => void;
}) {
  const hasPhoto = !!refPhotoUri;
  const empty = checklist.length === 0;
  return (
    <Screen
      wide
      gap={16}
      footer={
        <BottomActions caption={hasPhoto && empty ? '기준을 하나 이상 골라주세요' : undefined}>
          {hasPhoto ? (
            <Button label="다음" disabled={empty} onPress={onNext} />
          ) : (
            <Button label="기준 사진 찍기" onPress={onCamera} />
          )}
        </BottomActions>
      }
    >
      <Header onBack={onBack} />
      <Title sub="사진으로 확인할 수 있는 것만 골라요.">{'어떤 상태면\n청소한 걸로 할까요?'}</Title>
      <View accessibilityRole="list" accessibilityLabel="청소 기준" style={{ gap: 8 }}>
        {ROOM_CHECKLIST.map((item) => (
          <OptionCard key={item} label={item} selected={checklist.includes(item)} onPress={() => onToggle(item)} />
        ))}
      </View>
      <View style={{ gap: 10 }}>
        <SectionLabel>기준 사진</SectionLabel>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={hasPhoto ? '기준 사진 다시 찍기' : '기준 사진 찍기'}
          onPress={onCamera}
          style={({ pressed }) => [styles.refCard, { opacity: pressed ? 0.85 : 1 }]}
        >
          <View style={styles.thumb}>
            {hasPhoto ? (
              <Image source={{ uri: refPhotoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <Icon name="camera" size={26} color={colors.surface} />
            )}
          </View>
          <Text size={14} color="textOnInk" body style={{ flex: 1 }}>
            {hasPhoto
              ? '기준 사진을 찍어뒀어요. 누르면 다시 찍을 수 있어요.'
              : '지금 방을 한 번 찍어두세요. 매번 이 각도로 겹쳐서 찍게 돼요.'}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

export default function RoomSetupRoute() {
  const draft = useStore((s) => s.draft);
  const startDraft = useStore((s) => s.startDraft);
  const updateDraft = useStore((s) => s.updateDraft);

  // 초안 없이 들어오면(앱을 다시 켠 경우 등) 방청소 초안부터 만든다.
  // 처음 열 때만: 약속을 시작해 초안이 비워진 뒤 다시 만들지 않도록
  useEffect(() => {
    const d = useStore.getState().draft;
    if (!d || d.kind !== 'room') startDraft('room');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const room = draft?.kind === 'room' ? (draft.room ?? { checklist: [] }) : { checklist: [] as string[] };

  return (
    <RoomSetupView
      checklist={room.checklist}
      refPhotoUri={room.refPhotoUri}
      onToggle={(item) => {
        const has = room.checklist.includes(item);
        // 보기 순서를 지켜서 저장한다
        const next = ROOM_CHECKLIST.filter((t) => (t === item ? !has : room.checklist.includes(t)));
        updateDraft({ room: { ...room, checklist: next } });
      }}
      onBack={() => router.back()}
      onCamera={() => go(href.roomCamera)}
      onNext={() => go(href.stake)}
    />
  );
}

const styles = StyleSheet.create({
  refCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.ink,
  },
  thumb: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: colors.inkRaised,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
