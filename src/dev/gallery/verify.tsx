import { CameraPlaceholder } from '../../components';
import { BookRecordView } from '../../screens/BookRecord';
import { JudgingView } from '../../screens/Judging';
import { PendingView } from '../../screens/Pending';
import { PhotoConfirmView } from '../../screens/PhotoConfirm';
import { RejectedView } from '../../screens/Rejected';
import { SubmitErrorView } from '../../screens/SubmitError';
import { SuccessView } from '../../screens/Success';
import { VerifyView } from '../../screens/Verify';
import { noop, type GalleryEntry } from './types';

/** 2026-09-29(화) 기준 시각 */
const t = (h: number, m: number, s = 0) => new Date(2026, 8, 29, h, m, s).getTime();

const preview = <CameraPlaceholder text="카메라 미리보기" />;

const camera = (title: string, mission: string, now: number, end: number, refHint?: boolean) => (
  <VerifyView
    title={title}
    mission={mission}
    now={now}
    end={end}
    preview={
      refHint ? <CameraPlaceholder text={'카메라 미리보기\n(기준 사진이 반투명하게 겹쳐 보여요)'} /> : preview
    }
    onClose={noop}
    onShoot={noop}
    onFlip={noop}
  />
);

export const entries: GalleryEntry[] = [
  {
    n: 19,
    variant: '미라클모닝',
    title: '미라클모닝 인증',
    render: () => camera('미라클모닝 인증', '왼손으로 브이를 해주세요', t(6, 3, 27), t(6, 10)),
  },
  {
    n: 20,
    title: '헬스장 인증',
    render: () => camera('헬스장 인증', '오른손 엄지를 들어주세요', t(20, 48, 10), t(23, 0)),
  },
  {
    n: 21,
    title: '책읽기 인증',
    render: () => camera('책읽기 인증', '읽은 쪽 번호가 보이게 찍어주세요', t(22, 41, 5), t(23, 59)),
  },
  {
    n: 22,
    title: '방청소 인증',
    render: () => camera('방청소 인증', '기준 사진과 같은 각도로 찍어주세요', t(21, 14, 5), t(23, 59), true),
  },
  {
    n: 23,
    title: '사진 확인',
    render: () => (
      <PhotoConfirmView
        title="미라클모닝 인증"
        mission="왼손으로 브이를 해주세요"
        takenAt={t(6, 3, 27)}
        now={t(6, 3, 32)}
        end={t(6, 10)}
        onClose={noop}
        onRetake={noop}
        onSubmit={noop}
      />
    ),
  },
  {
    n: 24,
    title: '책읽기 기록',
    render: () => (
      <BookRecordView
        takenAt={t(22, 41, 5)}
        now={t(22, 41, 40)}
        end={t(23, 59)}
        books={['불편한 편의점', '아몬드']}
        initialTitle="불편한 편의점"
        onRetake={noop}
        onSubmit={noop}
      />
    ),
  },
  {
    n: 24,
    variant: '자동완성',
    title: '책읽기 기록: 자동완성',
    render: () => (
      <BookRecordView
        takenAt={t(22, 41, 5)}
        now={t(22, 41, 40)}
        end={t(23, 59)}
        books={['불편한 편의점', '아몬드']}
        initialTitle="편의"
        initialLine="오늘은 편의점 사장님 이야기"
        initialOpen
        onRetake={noop}
        onSubmit={noop}
      />
    ),
  },
  {
    n: 27,
    title: '판정 중',
    render: () => <JudgingView name="미라클모닝" now={t(6, 3, 32)} end={t(6, 10)} />,
  },
  {
    n: 28,
    title: '제출 실패',
    render: () => (
      <SubmitErrorView
        name="미라클모닝"
        takenAt={t(6, 4, 20)}
        now={t(6, 4, 20)}
        end={t(6, 10)}
        canRetake
        onRetry={noop}
        onRetake={noop}
        onHome={noop}
      />
    ),
  },
  {
    n: 29,
    title: '통과: 지킨 날',
    render: () => (
      <SuccessView
        model={{
          name: '미라클모닝',
          keptAt: t(6, 3, 27),
          end: t(6, 10),
          placeholder: '인증 사진',
          items: [
            { label: '오늘의 미션', value: '왼손으로 브이' },
            { label: '판정', value: '통과' },
          ],
          nextLine: '내일도 06:00에 만나요.',
        }}
        onHome={noop}
      />
    ),
  },
  {
    n: 30,
    title: '애매: 판정 확인 중',
    render: () => (
      <PendingView
        name="미라클모닝"
        mission="왼손으로 브이"
        reason="사진이 조금 어두워요"
        dueAt={t(12, 3, 32)}
        now={t(6, 4, 20)}
        onHome={noop}
      />
    ),
  },
  {
    n: 31,
    title: '불통과: 다시 찍기',
    render: () => (
      <RejectedView
        name="미라클모닝"
        mission="왼손으로 브이"
        reason="손이 화면에 보이지 않아요"
        end={t(6, 10)}
        now={t(6, 5, 48)}
        closed={false}
        onDispute={noop}
        onRetake={noop}
        onHome={noop}
      />
    ),
  },
  {
    n: 31,
    variant: '창닫힘',
    title: '불통과: 창이 닫힘',
    render: () => (
      <RejectedView
        name="미라클모닝"
        mission="왼손으로 브이"
        reason="손이 화면에 보이지 않아요"
        end={t(6, 10)}
        now={t(6, 11)}
        closed
        onDispute={noop}
        onRetake={noop}
        onHome={noop}
      />
    ),
  },
];
