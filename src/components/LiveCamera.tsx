/**
 * 앱 안 촬영 (SPEC 2.1: 앨범 사진 불가, 앱에서 바로 찍은 것만).
 * 카메라 권한이 없으면 촬영 영역 안에서 권한을 요청하고, 웹처럼 카메라가 없으면 안내만 보여준다.
 */
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '../theme';
import { Text } from './Text';

export type LiveCameraHandle = {
  /** 사진을 찍어 로컬 파일 주소를 돌려준다. 카메라가 없으면 null */
  take: () => Promise<string | null>;
};

type Props = {
  facing: CameraType;
  /** 기준 사진 등 촬영 영역 위에 반투명하게 겹칠 것 */
  children?: React.ReactNode;
};

export const LiveCamera = forwardRef<LiveCameraHandle, Props>(function LiveCamera({ facing, children }, ref) {
  const [perm, request] = useCameraPermissions();
  const cam = useRef<CameraView>(null);

  useImperativeHandle(ref, () => ({
    take: async () => {
      if (!cam.current || !perm?.granted) return null;
      try {
        const pic = await cam.current.takePictureAsync({ quality: 0.6, skipProcessing: false });
        return pic?.uri ?? null;
      } catch {
        return null;
      }
    },
  }));

  if (!perm) return <View style={StyleSheet.absoluteFill} />;

  if (!perm.granted)
    return (
      <View style={styles.center}>
        <Text size={14} color="textOnInk" align="center" body>
          인증 사진을 찍으려면{'\n'}카메라 권한이 필요해요
        </Text>
        {perm.canAskAgain ? (
          <Pressable accessibilityRole="button" onPress={request} style={styles.ask}>
            <Text size={14} weight="semibold" color="ink">
              카메라 허용하기
            </Text>
          </Pressable>
        ) : (
          <Text size={12} color="textOnInk" align="center">
            휴대폰 설정에서 카메라를 허용해 주세요
          </Text>
        )}
      </View>
    );

  return (
    <View style={StyleSheet.absoluteFill}>
      <CameraView ref={cam} style={StyleSheet.absoluteFill} facing={facing} mirror={facing === 'front'} />
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  ask: { height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
});
