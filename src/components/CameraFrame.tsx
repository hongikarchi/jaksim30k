import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fonts, letterSpacing } from '../theme';
import { Header, Screen } from './Screen';
import { Icon } from './Icon';
import { DotText, Text } from './Text';

type Props = {
  title: string;
  onClose: () => void;
  /** 주황 미션 배너 (한 줄). 없으면 배너를 숨긴다 */
  mission?: string;
  missionLabel?: string;
  /** 촬영 영역 안 (카메라 미리보기나 찍은 사진) */
  children?: ReactNode;
  /** 영역 아래쪽 촬영 시각 */
  stamp?: string;
  stampCaption?: string;
  /** 하단 96 높이 바 */
  bottom: ReactNode;
  /** 촬영 영역 위에 겹칠 것 (기준 사진 겹쳐 보기 등) */
  overlay?: ReactNode;
};

/** 카메라 틀 (SPEC 5.2) */
export function CameraFrame({
  title,
  onClose,
  mission,
  missionLabel = '오늘의 미션',
  children,
  stamp,
  stampCaption,
  bottom,
  overlay,
}: Props) {
  return (
    <Screen dark>
      <Header onBack={onClose} close title={title} center dark />
      {mission ? (
        <View style={styles.banner}>
          <Text size={12} weight="semibold" style={{ letterSpacing: letterSpacing(12, 'wide') }}>
            {missionLabel}
          </Text>
          <Text size={20} weight="bold" tight>
            {mission}
          </Text>
        </View>
      ) : null}
      <View style={styles.area}>
        {children}
        {overlay}
        <Corner pos="tl" />
        <Corner pos="tr" />
        <Corner pos="bl" />
        <Corner pos="br" />
        {stamp ? (
          <View style={styles.stamp} pointerEvents="none">
            <DotText size={40} color="signal">
              {stamp}
            </DotText>
            {stampCaption ? (
              <Text size={12} color="textOnInk" align="center">
                {stampCaption}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
      <View style={styles.bottom}>{bottom}</View>
    </Screen>
  );
}

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const t = pos[0] === 't';
  const l = pos[1] === 'l';
  return (
    <View
      pointerEvents="none"
      style={[
        styles.corner,
        t ? { top: 18, borderTopWidth: 3 } : { bottom: 18, borderBottomWidth: 3 },
        l ? { left: 18, borderLeftWidth: 3 } : { right: 18, borderRightWidth: 3 },
        pos === 'tl' && { borderTopLeftRadius: 8 },
        pos === 'tr' && { borderTopRightRadius: 8 },
        pos === 'bl' && { borderBottomLeftRadius: 8 },
        pos === 'br' && { borderBottomRightRadius: 8 },
      ]}
    />
  );
}

/** 촬영 바: 남은 시간 / 셔터 / 카메라 전환 */
export function ShutterBar({
  remaining,
  onShoot,
  onFlip,
  busy,
}: {
  remaining?: string;
  onShoot: () => void;
  onFlip?: () => void;
  busy?: boolean;
}) {
  return (
    <View style={styles.bar}>
      <View style={{ width: 84 }}>
        {remaining ? (
          <>
            <Text size={12} color="textOnInk">
              남은 시간
            </Text>
            <DotText size={22} color="surface">
              {remaining}
            </DotText>
          </>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="촬영"
        onPress={onShoot}
        disabled={busy}
        style={({ pressed }) => [styles.shutter, { opacity: pressed || busy ? 0.6 : 1 }]}
      >
        <View style={styles.shutterInner} />
      </Pressable>
      <View style={{ width: 84, alignItems: 'flex-end' }}>
        {onFlip ? (
          <Pressable accessibilityRole="button" accessibilityLabel="카메라 전환" onPress={onFlip} style={styles.flip}>
            <Icon name="flip" size={22} color={colors.surface} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/** 카메라를 쓸 수 없을 때 촬영 영역 안내 */
export function CameraPlaceholder({ text }: { text: string }) {
  return (
    <Text size={14} color="textOnInk" align="center" style={{ paddingHorizontal: 24, fontFamily: fonts.body.regular }}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  banner: { gap: 4, paddingVertical: 16, paddingHorizontal: 20, borderRadius: 18, backgroundColor: colors.signal },
  area: {
    flex: 1,
    minHeight: 0,
    borderRadius: 24,
    backgroundColor: colors.inkSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  corner: { position: 'absolute', width: 26, height: 26, borderColor: colors.surface },
  stamp: { position: 'absolute', bottom: 44, left: 0, right: 0, alignItems: 'center', gap: 2 },
  bottom: { minHeight: 96, justifyContent: 'center' },
  bar: { height: 96, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 },
  shutter: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: colors.surface, padding: 6 },
  shutterInner: { flex: 1, borderRadius: 30, backgroundColor: colors.surface },
  flip: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.inkSoft, alignItems: 'center', justifyContent: 'center' },
});
