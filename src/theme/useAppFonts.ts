// 쓰는 굵기만 번들에 들어가도록 패키지 루트가 아니라 굵기별 경로에서 가져온다.
import { DotGothic16_400Regular } from '@expo-google-fonts/dotgothic16/400Regular';
import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono/500Medium';
import { IBMPlexSansKR_400Regular } from '@expo-google-fonts/ibm-plex-sans-kr/400Regular';
import { IBMPlexSansKR_500Medium } from '@expo-google-fonts/ibm-plex-sans-kr/500Medium';
import { IBMPlexSansKR_600SemiBold } from '@expo-google-fonts/ibm-plex-sans-kr/600SemiBold';
import { IBMPlexSansKR_700Bold } from '@expo-google-fonts/ibm-plex-sans-kr/700Bold';
import { useFonts } from 'expo-font';

/** 앱에서 쓰는 폰트를 모두 불러온다. 키 이름이 fonts 토큰의 값과 같아야 한다. */
export function useAppFonts() {
  return useFonts({
    DotGothic16_400Regular,
    IBMPlexSansKR_400Regular,
    IBMPlexSansKR_500Medium,
    IBMPlexSansKR_600SemiBold,
    IBMPlexSansKR_700Bold,
    IBMPlexMono_500Medium,
  });
}
