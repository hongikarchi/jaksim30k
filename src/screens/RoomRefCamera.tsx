/** 10. 기준 사진 촬영: 방청소 인증 때 겹쳐 볼 기준 사진을 찍는다 */
import type { CameraType } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { CameraFrame, CameraPlaceholder, LiveCamera, ShutterBar, Text, type LiveCameraHandle } from '../components';
import { useStore } from '../store';

/** 카메라 격자선. 이 화면에서만 쓰는 반투명 흰색 (SPEC 5.1) */
const GRID_LINE = 'rgba(255, 255, 255, 0.18)';

export function RoomRefCameraView({
  camera,
  onClose,
  onShoot,
  onFlip,
  busy,
}: {
  /** 촬영 영역 안 (카메라 미리보기) */
  camera: ReactNode;
  onClose: () => void;
  onShoot: () => void;
  onFlip: () => void;
  busy?: boolean;
}) {
  return (
    <CameraFrame
      title="기준 사진 촬영"
      onClose={onClose}
      missionLabel="기준 사진"
      mission="청소한 방 전체가 보이게"
      overlay={
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[styles.v, { left: '33.33%' }]} />
          <View style={[styles.v, { left: '66.66%' }]} />
          <View style={[styles.h, { top: '33.33%' }]} />
          <View style={[styles.h, { top: '66.66%' }]} />
          <View style={styles.caption}>
            <Text size={12} color="textOnInk" align="center">
              이 각도로 매번 인증 사진을 찍게 돼요
            </Text>
          </View>
        </View>
      }
      bottom={<ShutterBar onShoot={onShoot} onFlip={onFlip} busy={busy} />}
    >
      {camera}
    </CameraFrame>
  );
}

export default function RoomRefCameraRoute() {
  const cam = useRef<LiveCameraHandle>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [busy, setBusy] = useState(false);

  const shoot = async () => {
    if (busy) return;
    setBusy(true);
    const uri = await cam.current?.take();
    setBusy(false);
    // 카메라가 없으면(웹 등) 아무것도 하지 않는다. 촬영 영역에 안내가 보인다
    if (!uri) return;
    const { draft, updateDraft } = useStore.getState();
    const room = draft?.room ?? { checklist: [] };
    updateDraft({ room: { ...room, refPhotoUri: uri } });
    router.back();
  };

  return (
    <RoomRefCameraView
      camera={<LiveCamera ref={cam} facing={facing} />}
      onClose={() => router.back()}
      onShoot={shoot}
      onFlip={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
      busy={busy}
    />
  );
}

/** 갤러리용 미리보기 자리 */
export const RoomRefCameraPreview = () => <CameraPlaceholder text="카메라 미리보기" />;

const styles = StyleSheet.create({
  v: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: GRID_LINE },
  h: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: GRID_LINE },
  caption: { position: 'absolute', bottom: 44, left: 0, right: 0, alignItems: 'center' },
});
