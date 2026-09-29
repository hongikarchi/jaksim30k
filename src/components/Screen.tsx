import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { colors, layout } from '../theme';
import { Icon } from './Icon';
import { IconButton } from './Button';
import { Text } from './Text';

type Props = {
  children: ReactNode;
  /** 맨 아래 고정 영역 (메인 버튼 묶음). 항상 같은 위치에 온다 */
  footer?: ReactNode;
  /** 카메라 화면이면 camera 바탕 */
  dark?: boolean;
  /** 좌우 여백 24 (설명 위주 화면) */
  wide?: boolean;
  /** 헤더 없는 결과 화면은 상단 여백을 조금 더 준다 */
  topGap?: 'default' | 'wide';
  /** 본문 요소 사이 간격 */
  gap?: number;
  /** 본문이 길면 스크롤 */
  scroll?: boolean;
  /** 화면 위에 겹치는 시트 등 */
  overlay?: ReactNode;
};

/**
 * 화면 틀 (SPEC 5.2). 390×844 기준, 좌우 20~24, 하단 32.
 * 상태 표시줄·홈 인디케이터 영역은 안전 영역으로 따로 비운다.
 */
export function Screen({
  children,
  footer,
  dark,
  wide,
  topGap = 'default',
  gap = 14,
  scroll,
  overlay,
}: Props) {
  const insets = useSafeAreaInsets();
  const gutter = wide ? layout.gutterWide : layout.gutter;
  // 와이어프레임의 상단 56/64는 상태 표시줄(약 47)을 포함한 값이다
  const top = insets.top + (topGap === 'wide' ? 16 : 8);
  const bottom = Math.max(layout.bottom, insets.bottom + 12);

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 16, gap }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, { paddingHorizontal: gutter, gap }]}>{children}</View>
  );

  return (
    <View style={[styles.flex, { backgroundColor: dark ? colors.camera : colors.ground }]}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      {/* iOS의 padding 방식은 자기 paddingBottom을 키보드 높이로 덮어쓰므로 여백은 안쪽 View에 준다 */}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.flex, { paddingTop: top, paddingBottom: bottom }]}>
          {body}
          {footer ? <View style={{ paddingHorizontal: gutter, paddingTop: 12 }}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
      {overlay}
    </View>
  );
}

/** 빈 공간을 채워 아래 요소를 바닥으로 민다 */
export function Spacer() {
  return <View style={styles.flex} />;
}

type HeaderProps = {
  onBack?: () => void;
  /** 뒤로 대신 닫기(×) */
  close?: boolean;
  title?: string;
  /** 제목을 가운데 둔다 (카메라 화면) */
  center?: boolean;
  /** 오른쪽 글자 (예: 1 / 3) */
  step?: string;
  right?: ReactNode;
  dark?: boolean;
};

/** 화면 위쪽 줄: 뒤로 + 제목 + 오른쪽 */
export function Header({ onBack, close, title, center, step, right, dark }: HeaderProps) {
  const color = dark ? colors.surface : colors.ink;
  return (
    <View style={styles.header}>
      {onBack ? (
        <IconButton label={close ? '닫기' : '뒤로'} onPress={onBack} style={styles.back}>
          <Icon name={close ? 'close' : 'back'} size={24} color={color} />
        </IconButton>
      ) : (
        <View style={styles.headerSide} />
      )}
      {title ? (
        <Text
          size={center ? 16 : 20}
          weight={center ? 'semibold' : 'bold'}
          color={dark ? 'surface' : 'ink'}
          tight={!center}
          numberOfLines={1}
          style={center ? styles.centerTitle : styles.flex}
        >
          {title}
        </Text>
      ) : (
        <View style={styles.flex} />
      )}
      {step ? (
        <Text size={13} color="text2" style={{ fontFamily: 'IBMPlexMono_500Medium' }}>
          {step}
        </Text>
      ) : (
        right ?? (center ? <View style={styles.headerSide} /> : null)
      )}
    </View>
  );
}

/** 화면 큰 제목 (26px, 굵게) */
export function Title({ children, size = 26, sub }: { children: ReactNode; size?: number; sub?: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text size={size} weight="bold" tight="more" style={{ lineHeight: Math.round(size * 1.3) }}>
        {children}
      </Text>
      {sub ? (
        <Text size={15} color="text3" body>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

/** 섹션 라벨 (14px text-2 굵게) */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Text size={14} weight="semibold" color="text2">
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 4 },
  back: { marginLeft: -10 },
  headerSide: { width: 44, height: 44 },
  centerTitle: { flex: 1, textAlign: 'center' },
});
