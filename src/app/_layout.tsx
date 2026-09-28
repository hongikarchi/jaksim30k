import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NotificationSync } from '../lib/notifications';
import { useHydrated, useStore } from '../store';
import { colors, useAppFonts } from '../theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();
  const hydrated = useHydrated();
  const ready = (fontsLoaded || !!fontError) && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // 가짜 서버의 시간 흐름: 1초마다, 앱으로 돌아올 때마다 처리
  useEffect(() => {
    if (!ready) return;
    const tick = () => useStore.getState().tick();
    tick();
    const id = setInterval(tick, 1000);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && tick());
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <NotificationSync />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ground }, animation: 'slide_from_right' }}>
        <Stack.Screen name="pg" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="verify/[occ]" options={{ animation: 'fade', contentStyle: { backgroundColor: colors.camera } }} />
        <Stack.Screen name="verify/confirm" options={{ animation: 'fade', contentStyle: { backgroundColor: colors.camera } }} />
        <Stack.Screen name="create/room-camera" options={{ animation: 'fade', contentStyle: { backgroundColor: colors.camera } }} />
      </Stack>
    </SafeAreaProvider>
  );
}
