/**
 * 색 토큰. SPEC 5.1이 기준이고, `wireframe` 묶음은 SPEC에는 없지만
 * 와이어프레임에서 반복해서 쓰이는 값을 그대로 옮긴 것이다.
 */
export const colors = {
  // SPEC 5.1
  ink: '#151515', // 글자, 검정 카드, 메인 버튼
  signal: '#F25C05', // 숫자 강조, LED, 선택된 날, 경고 카드
  ground: '#E9E8E4', // 모든 화면 바탕(카메라 화면 제외)
  surface: '#FFFFFF', // 흰 카드, 목록, 입력칸
  camera: '#0E0E0E', // 촬영·사진 확인 화면 바탕
  text2: '#5E5E59', // 설명 글, 보조 버튼 글자
  text3: '#6B6B66', // 목록의 라벨
  lineOnSurface: '#EAE9E5', // 흰 카드 안 구분선
  lineOnGround: '#D2D1CC', // 회색 바탕 위 구분선
  disabled: '#C9C8C3', // 비활성 메인 버튼 (SPEC 5.2)

  // 와이어프레임에서 가져온 값
  textOnInk: '#B8B8B2', // 검정 카드 위 라벨·부연 글자
  textBody: '#3F3F3C', // 안내 카드 본문(14px, 줄간격 1.5)
  textMuted: '#9A9A94', // 카메라 화면 보조 글자, 플레이스홀더
  border: '#DAD9D4', // 입력칸 1px 테두리, 사진 자리 회색 박스
  fill: '#EFEEEA', // −/+ 버튼 같은 흰 패널 안 회색 채움
  ledOff: '#A9A8A3', // 꺼진 LED 테두리
  cameraPanel: '#262625', // 카메라 촬영 영역
  cameraControl: '#2A2A28', // 카메라 화면 둥근 버튼
  inkRaised: '#3A3A38', // 검정 카드 안 막대·썸네일 자리
  scrim: 'rgba(21, 21, 21, 0.45)', // 하단 시트 덮개
  signalGlow: 'rgba(242, 92, 5, 0.22)', // 켜진 LED의 빛 번짐

  // 외부 브랜드 색 (카카오 버튼)
  kakao: '#FEE500',
  kakaoText: '#191600',
} as const;

export type ColorToken = keyof typeof colors;
