/**
 * 색 토큰 (SPEC 5.1). 여기 없는 색은 쓰지 않는다.
 * 와이어프레임의 비슷한 값을 어느 토큰으로 읽는지는 SPEC 5.1 대응표를 따른다.
 */
export const colors = {
  ink: '#151515', // 글자, 검정 카드, 메인 버튼
  signal: '#F25C05', // 숫자 강조, LED, 선택된 날, 경고 카드
  ground: '#E9E8E4', // 모든 화면 바탕(카메라 화면 제외)
  surface: '#FFFFFF', // 흰 카드, 목록, 입력칸
  camera: '#0E0E0E', // 촬영·사진 확인 화면 바탕
  text2: '#5E5E59', // 설명 글, 보조 버튼 글자
  text3: '#6B6B66', // 목록의 라벨
  lineOnSurface: '#EAE9E5', // 흰 카드 안 구분선
  lineOnGround: '#D2D1CC', // 회색 바탕 위 구분선
  border: '#C9C8C3', // 입력칸·보조 버튼 1px 테두리, 선택 해제 동그라미 테두리
  disabled: '#C9C8C3', // 비활성 메인 버튼 바탕 (border와 같은 값)
  textOnInk: '#B8B8B2', // 검정 카드·카메라 화면 위 라벨과 부연 글자
  textBody: '#3F3F3C', // 안내 카드 본문(14px, 줄간격 1.5)
  fill: '#EFEEEA', // 흰 패널 안 회색 채움(−/+ 버튼, 진행 막대 바탕, 달력 칸)
  ledOff: '#A9A8A3', // 꺼진 LED 테두리, 점선 빈자리
  inkSoft: '#2A2A28', // 카메라 촬영 영역, 카메라 화면 둥근 버튼, 검정 바탕 위 버튼
  inkRaised: '#3A3A38', // 검정 카드 안 막대·점·썸네일 자리, 빈 시계 숫자
  scrim: 'rgba(21, 21, 21, 0.45)', // 하단 시트 덮개
  signalGlow: 'rgba(242, 92, 5, 0.22)', // 켜진 LED의 빛 번짐

  // 외부 브랜드 색 (카카오 버튼)
  kakao: '#FEE500', // 카카오 버튼 바탕
  kakaoText: '#191600', // 카카오 버튼 글자
} as const;

export type ColorToken = keyof typeof colors;
