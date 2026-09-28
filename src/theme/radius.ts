/** 모서리 토큰 (px). SPEC 5.2 + 와이어프레임 반복 값 */
export const radius = {
  button: 14, // 메인·보조 버튼, 입력칸
  pill: 16, // 작은 액션 버튼(높이 32)
  card: 22, // 흰 목록 카드
  camera: 24, // 카메라 촬영 영역
  sheet: 28, // 하단 시트 위쪽 모서리
  clock: 32, // 시계 카드
  round: 9999, // 동그라미 선택 표시, LED
} as const;
