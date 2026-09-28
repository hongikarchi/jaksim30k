/** 간격 토큰 (px). 와이어프레임의 gap·padding 값에서 가져왔다. */
export const spacing = {
  0: 0,
  2: 2,
  4: 4,
  6: 6,
  8: 8,
  10: 10, // 버튼 묶음 안 버튼 ↔ 하단 설명 글
  12: 12,
  14: 14,
  16: 16,
  18: 18,
  20: 20,
  22: 22,
  24: 24,
  28: 28,
  32: 32,
} as const;

/** 화면 틀 (SPEC 5.2). 기준 크기 390×844 */
export const layout = {
  screenWidth: 390,
  screenHeight: 844,
  /** 좌우 여백 20~24. 기본 20, 설명 위주 화면 24 */
  gutter: 20,
  gutterWide: 24,
  /** 상단 여백 (와이어프레임 기준, 상태 표시줄 포함) */
  top: 56,
  topWide: 64,
  /** 하단 여백. 메인 버튼은 항상 이 위치 */
  bottom: 32,
} as const;

/** 반복되는 요소 크기 (SPEC 5.2) */
export const size = {
  buttonHeight: 56, // 메인·보조 버튼
  textButtonHeight: 44, // "나중에 할게요" 같은 텍스트 버튼
  pillHeight: 32, // 작은 액션 버튼(예약, 끝내기, 변경, 해제, 인증)
  touchTarget: 44, // 아이콘 버튼 최소 터치 영역
  inputHeight: 52,
  cameraBarHeight: 96,
} as const;
