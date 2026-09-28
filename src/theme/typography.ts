/**
 * 서체 토큰 (SPEC 5.1).
 * React Native에서는 커스텀 폰트의 fontWeight가 기기마다 다르게 먹기 때문에
 * 굵기마다 따로 등록한 폰트 이름을 fontFamily로 지정한다. fontWeight는 쓰지 않는다.
 */
export const fonts = {
  /** 시계·금액·횟수 숫자 전용. 한글을 넣지 않는다. 단위(원, 회)는 본문 서체로 따로. */
  dot: 'DotGothic16_400Regular',
  /** 모든 글자 */
  body: {
    regular: 'IBMPlexSansKR_400Regular',
    medium: 'IBMPlexSansKR_500Medium',
    semibold: 'IBMPlexSansKR_600SemiBold',
    bold: 'IBMPlexSansKR_700Bold',
  },
  /** PRO 뱃지 */
  mono: 'IBMPlexMono_500Medium',
} as const;

/** 와이어프레임에서 쓰이는 글자 크기 (px) */
export const fontSize = {
  10: 10,
  11: 11,
  12: 12,
  13: 13, // 하단 설명 글, 카드 라벨
  14: 14,
  15: 15,
  16: 16,
  17: 17, // 메인 버튼 글자
  18: 18,
  20: 20, // 시계 카드 제목
  22: 22, // 화면 제목
  24: 24,
  26: 26,
  28: 28,
  30: 30,
  32: 32,
  34: 34,
  36: 36,
  40: 40,
  44: 44,
  64: 64,
  75: 75, // 시계 카드 도트 숫자(시:분:초 8자리)
  104: 104,
} as const;

/** 줄 높이 배수. RN의 lineHeight는 px이므로 lineHeight(size, key)로 바꿔 쓴다. */
export const lineHeightRatio = {
  tight: 1, // 도트 숫자
  snug: 1.3, // 제목
  body: 1.5, // 본문·설명
} as const;

/** 자간(em). RN의 letterSpacing은 px이므로 letterSpacing(size, key)로 바꿔 쓴다. */
export const letterSpacingEm = {
  none: 0,
  tight: -0.02, // 제목
  tighter: -0.03, // 큰 제목
  wide: 0.08, // PRO 뱃지
  wider: 0.1, // 영문 라벨
} as const;

export const lineHeight = (size: number, ratio: keyof typeof lineHeightRatio = 'body') =>
  Math.round(size * lineHeightRatio[ratio]);

export const letterSpacing = (size: number, key: keyof typeof letterSpacingEm) =>
  size * letterSpacingEm[key];
