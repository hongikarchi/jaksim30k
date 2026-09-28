# 개발 가이드

CLAUDE.md와 SPEC.md가 먼저다. 이 문서는 코드 구조와 작업 방법만 적는다.

## 폴더

| 폴더 | 내용 |
| --- | --- |
| `src/app/` | Expo Router 주소. 파일 하나가 주소 하나. 대부분 `export { default } from '../screens/X'` 한 줄 |
| `src/screens/` | 화면. `XView`(props만 받는 화면)와 `default`(스토어를 읽어 `XView`에 넘기는 연결부)를 함께 둔다 |
| `src/components/` | 공통 컴포넌트 (SPEC 5.2). 새 컴포넌트를 만들기 전에 여기서 먼저 찾는다 |
| `src/theme/` | 토큰 (색·서체·간격·모서리). 색 값을 코드에 직접 쓰지 않는다 |
| `src/domain/` | 도메인 타입(`types.ts`)과 규칙·표시 함수(`rules.ts`) |
| `src/store/` | 가짜 서버. `index.ts`(스토어·액션), `engine.ts`(시간 흐름 규칙), `selectors.ts`(화면용 계산) |
| `src/lib/` | 주소 모음(`routes.ts`), 이동(`nav.ts`), 로컬 알림(`notifications.tsx`) |
| `src/dev/` | 개발용: 예시 데이터(`scenarios.ts`), 화면 갤러리(`gallery/`) |

## 가짜 서버

진짜 백엔드 전까지 앱 안의 스토어가 서버 노릇을 한다. 로그인·카드 등록·AI 판정·결제는 모두 가짜이고 실제 돈은 나가지 않는다.

- 데이터는 기기에 저장된다 (`AsyncStorage`, 웹은 localStorage).
- 1초마다 `tick`이 돌며 인증 창 열림·마감·결제·검수 결과를 처리한다.
- 앱 안의 "지금" = 실제 시각 + `devOffset`. 개발 메뉴에서 시간을 앞으로 옮겨 마감·결제를 바로 볼 수 있다.
- 판정·검수·이의제기·결제 결과는 개발 메뉴의 설정(`dev`)을 따른다.
- 알림으로 들어오는 화면(놓친 날, 결제 실패, 이의제기 결과 등)은 `events`에 쌓이고, 홈이 열릴 때 안 본 사건이 있으면 그 화면으로 보낸다.

## 화면 만드는 법

1. 와이어프레임(`docs/wireframes/X.dc.html`)에서 구조·간격·문구를 읽는다. 색은 SPEC 5.1 대응표에 따라 토큰으로 바꾼다.
2. `src/screens/X.tsx`에 `XView`를 만든다. 시간은 `now` prop으로 받고, 이동은 `onXxx` 콜백으로 받는다.
3. 같은 파일의 `default export`에서 `useStore`·`useNow`·selectors로 값을 만들어 `XView`에 넘긴다. 이동은 `lib/routes.ts`의 `href`와 `lib/nav.ts`를 쓴다.
4. `src/app/...`에 주소 파일을 만든다.
5. `src/dev/gallery/<묶음>.tsx`에 예시 props로 갤러리 항목을 추가한다.

## 확인

```bash
npx tsc --noEmit                       # 타입 검사
scripts/shots.sh <출력 폴더> <경로>...  # 웹으로 빌드해서 390×844로 찍기
```

- 갤러리 화면: `/dev/gallery/19`
- 예시 데이터로 실제 흐름: `/dev/seed?s=open` (홈으로), `/dev/seed?s=open&to=/promise/...` (원하는 주소로)
- 예시 데이터 이름은 `src/dev/scenarios.ts`의 `SCENARIOS`
