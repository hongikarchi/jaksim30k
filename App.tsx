import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  colors,
  fonts,
  fontSize,
  layout,
  letterSpacing,
  lineHeight,
  radius,
  spacing,
  useAppFonts,
  type ColorToken,
} from './src/theme';

SplashScreen.preventAutoHideAsync();

// 토큰 확인용 임시 화면. 4단계 화면 갤러리가 생기면 대체한다.
export default function App() {
  const [loaded, error] = useAppFonts();

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>디자인 토큰</Text>

      <Text style={styles.section}>색</Text>
      <View style={styles.swatches}>
        {(Object.keys(colors) as ColorToken[]).map((key) => (
          <View key={key} style={styles.swatch}>
            <View style={[styles.chip, { backgroundColor: colors[key] }]} />
            <Text style={styles.label}>{key}</Text>
            <Text style={styles.value}>{colors[key]}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.section}>서체</Text>
      <View style={styles.clockCard}>
        <Text style={styles.clockLabel}>남은 시간</Text>
        <Text style={styles.clockDigits}>07:42:10</Text>
      </View>
      <View style={styles.card}>
        <Text style={[styles.sample, { fontFamily: fonts.body.regular }]}>본문 400 지금 인증하세요</Text>
        <Text style={[styles.sample, { fontFamily: fonts.body.medium }]}>본문 500 지금 인증하세요</Text>
        <Text style={[styles.sample, { fontFamily: fonts.body.semibold }]}>본문 600 지금 인증하세요</Text>
        <Text style={[styles.sample, { fontFamily: fonts.body.bold }]}>본문 700 지금 인증하세요</Text>
        <View style={styles.amountRow}>
          <Text style={styles.amountDigits}>30,000</Text>
          <Text style={styles.amountUnit}>원</Text>
        </View>
        <View style={styles.proBadge}>
          <Text style={styles.proText}>PRO</Text>
        </View>
      </View>

      <Text style={styles.section}>모서리</Text>
      <View style={styles.swatches}>
        {(Object.keys(radius) as (keyof typeof radius)[])
          .filter((key) => key !== 'round')
          .map((key) => (
            <View key={key} style={styles.swatch}>
              <View style={[styles.radiusBox, { borderRadius: radius[key] }]} />
              <Text style={styles.label}>{key}</Text>
              <Text style={styles.value}>{radius[key]}</Text>
            </View>
          ))}
      </View>

      <View style={styles.button}>
        <Text style={styles.buttonText}>메인 버튼</Text>
      </View>
      <Text style={styles.caption}>하단 설명 글은 13px text-2 가운데 정렬이에요</Text>

      <StatusBar style="dark" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  content: {
    paddingTop: layout.top,
    paddingHorizontal: layout.gutter,
    paddingBottom: layout.bottom,
    gap: spacing[14],
  },
  title: {
    fontFamily: fonts.body.bold,
    fontSize: fontSize[22],
    letterSpacing: letterSpacing(fontSize[22], 'tight'),
    color: colors.ink,
  },
  section: {
    fontFamily: fonts.body.bold,
    fontSize: fontSize[15],
    color: colors.ink,
    marginTop: spacing[8],
  },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[10] },
  swatch: { width: 80, gap: spacing[2] },
  chip: {
    height: 48,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.lineOnGround,
  },
  label: { fontFamily: fonts.body.semibold, fontSize: fontSize[11], color: colors.ink },
  value: { fontFamily: fonts.body.regular, fontSize: fontSize[10], color: colors.text3 },
  clockCard: {
    backgroundColor: colors.ink,
    borderRadius: radius.clock,
    paddingVertical: 26,
    paddingHorizontal: spacing[24],
    gap: spacing[20],
  },
  clockLabel: { fontFamily: fonts.body.semibold, fontSize: fontSize[13], color: colors.textOnInk },
  clockDigits: {
    fontFamily: fonts.dot,
    fontSize: fontSize[75],
    lineHeight: lineHeight(fontSize[75], 'tight'),
    color: colors.signal,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing[20],
    gap: spacing[8],
  },
  sample: { fontSize: fontSize[15], color: colors.ink },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing[4] },
  amountDigits: { fontFamily: fonts.dot, fontSize: fontSize[40], color: colors.ink },
  amountUnit: { fontFamily: fonts.body.semibold, fontSize: fontSize[17], color: colors.ink },
  proBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.ink,
    borderRadius: 6,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[6],
  },
  proText: {
    fontFamily: fonts.mono,
    fontSize: fontSize[10],
    letterSpacing: letterSpacing(fontSize[10], 'wide'),
    color: colors.signal,
  },
  radiusBox: { height: 48, backgroundColor: colors.surface },
  button: {
    height: 56,
    borderRadius: radius.button,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[16],
  },
  buttonText: { fontFamily: fonts.body.semibold, fontSize: fontSize[17], color: colors.surface },
  caption: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize[13],
    color: colors.text2,
    textAlign: 'center',
  },
});
