/** 19~22. 미라클모닝·헬스장·책읽기·방청소 인증 (촬영). 약속 종류는 occurrence의 약속에서 고른다 */
import { useLocalSearchParams } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import {
  BottomActions,
  Button,
  CameraFrame,
  CameraPlaceholder,
  Header,
  LiveCamera,
  Screen,
  ShutterBar,
  Spacer,
  Text,
  type LiveCameraHandle,
} from '../components';
import { KIND_NAMES, clockSec, shortRemain, whenLabel } from '../domain/rules';
import type { Occurrence, PromiseT } from '../domain/types';
import { href } from '../lib/routes';
import { goHome, replace } from '../lib/nav';
import { nowOf, useNow, useStore } from '../store';
import { acceptsPhoto, param } from './VerifyShared';

export const STAMP_CAPTION = '촬영 시각이 새겨져요. 앨범 사진은 쓸 수 없어요';

export function VerifyView({
  title,
  mission,
  now,
  end,
  preview,
  refPhotoUri,
  busy,
  onClose,
  onShoot,
  onFlip,
}: {
  title: string;
  mission?: string;
  now: number;
  end: number;
  /** 촬영 영역 안 (실제 앱은 LiveCamera, 갤러리는 자리 표시) */
  preview?: ReactNode;
  /** 방청소: 기준 사진을 반투명하게 겹친다 */
  refPhotoUri?: string;
  busy?: boolean;
  onClose: () => void;
  onShoot: () => void;
  onFlip?: () => void;
}) {
  return (
    <CameraFrame
      title={title}
      onClose={onClose}
      mission={mission}
      stamp={clockSec(now)}
      stampCaption={STAMP_CAPTION}
      overlay={
        refPhotoUri ? (
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: 0.35 }]}>
            <Image source={{ uri: refPhotoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          </View>
        ) : null
      }
      bottom={<ShutterBar remaining={shortRemain(end - now)} onShoot={onShoot} onFlip={onFlip} busy={busy} />}
    >
      {preview ?? <CameraPlaceholder text="카메라 미리보기" />}
    </CameraFrame>
  );
}

/** 인증할 수 없을 때 (창이 닫힘, 아직 안 열림, 이미 지킴 등) */
export function VerifyClosedView({
  title,
  heading,
  sub,
  onClose,
  onHome,
}: {
  title: string;
  heading: string;
  sub?: string;
  onClose: () => void;
  onHome: () => void;
}) {
  return (
    <Screen
      dark
      footer={
        <BottomActions>
          <Button label="홈으로" variant="white" onPress={onHome} />
        </BottomActions>
      }
    >
      <Header onBack={onClose} close title={title} center dark />
      <Spacer />
      <View style={{ gap: 8, alignItems: 'center', paddingHorizontal: 12 }}>
        <Text size={20} weight="bold" color="surface" tight align="center">
          {heading}
        </Text>
        {sub ? (
          <Text size={14} color="textOnInk" align="center" body>
            {sub}
          </Text>
        ) : null}
      </View>
      <Spacer />
    </Screen>
  );
}

/** 촬영할 수 없는 이유 문구 */
export function closedCopy(o: Occurrence | undefined, now: number): { heading: string; sub?: string } {
  if (!o) return { heading: '인증 창을 찾을 수 없어요', sub: '홈에서 다시 인증해 주세요' };
  if (o.status === 'kept' || o.status === 'excused') return { heading: '오늘은 이미 지켰어요', sub: '다음 인증 때 만나요' };
  if (o.status === 'judging' || o.status === 'reviewing')
    return { heading: '제출한 사진을 확인하고 있어요', sub: '결과가 나오면 알려드려요' };
  if (o.status === 'paused') return { heading: '오늘은 쉬어가는 날이에요' };
  if (now < o.start) return { heading: '아직 인증 시간이 아니에요', sub: `${whenLabel(o.start, now)}에 열려요` };
  return { heading: '인증 창이 닫혔어요', sub: '인증 시간이 지나서 더 찍을 수 없어요' };
}

export const verifyTitle = (p: PromiseT | undefined) => (p ? `${KIND_NAMES[p.kind]} 인증` : '인증');

export default function VerifyRoute() {
  const occId = param(useLocalSearchParams<{ occ: string }>().occ);
  const now = useNow();
  const o = useStore((s) => s.occurrences[occId]);
  const p = useStore((s) => (o ? s.promises[o.promiseId] : undefined));
  // 미라클모닝은 셀카로 찍는 경우가 많아 전면, 나머지(기구·책·방)는 후면으로 시작
  const [facing, setFacing] = useState<'front' | 'back'>(p?.kind === 'morning' ? 'front' : 'back');
  const [busy, setBusy] = useState(false);
  const cam = useRef<LiveCameraHandle>(null);
  const title = verifyTitle(p);

  if (!o || !p || !acceptsPhoto(o, now)) {
    const c = closedCopy(o, now);
    return <VerifyClosedView title={title} heading={c.heading} sub={c.sub} onClose={goHome} onHome={goHome} />;
  }

  const shoot = async () => {
    if (busy) return;
    setBusy(true);
    const uri = (await cam.current?.take()) ?? null;
    const takenAt = nowOf(useStore.getState());
    setBusy(false);
    if (uri === null) {
      // 카메라가 없으면(웹, 권한 거부) 찍지 않는다. 개발 중에만 빈 사진으로 흐름을 이어 볼 수 있다
      if (!__DEV__) return;
    }
    replace(href.photoConfirm(occId, uri ?? '', takenAt));
  };

  return (
    <VerifyView
      title={title}
      mission={o.mission}
      now={now}
      end={o.end}
      refPhotoUri={p.kind === 'room' ? p.room?.refPhotoUri : undefined}
      preview={<LiveCamera ref={cam} facing={facing} />}
      busy={busy}
      onClose={goHome}
      onShoot={shoot}
      onFlip={() => setFacing((f) => (f === 'front' ? 'back' : 'front'))}
    />
  );
}
