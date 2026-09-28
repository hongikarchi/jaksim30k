import { presetSchedule } from '../../domain/rules';
import type { Draft } from '../../domain/types';
import { CardFailedView } from '../../screens/CardFailed';
import { ConfirmView, stakeRange, summaryOf } from '../../screens/Confirm';
import { PgMockView } from '../../screens/PgMock';
import { RoomRefCameraPreview, RoomRefCameraView } from '../../screens/RoomRefCamera';
import { ROOM_CHECKLIST, RoomSetupView } from '../../screens/RoomSetup';
import { StakeView } from '../../screens/Stake';
import { noop, type GalleryEntry } from './types';

const morning: Draft = { kind: 'morning', schedule: presetSchedule('morning'), method: 'photo', maxAmount: 30000 };
const card = { company: '신한카드', last4: '4821' };

export const entries: GalleryEntry[] = [
  {
    n: 9,
    title: '방청소 기준',
    render: () => (
      <RoomSetupView
        checklist={ROOM_CHECKLIST.slice(0, 3)}
        onToggle={noop}
        onBack={noop}
        onCamera={noop}
        onNext={noop}
      />
    ),
  },
  {
    n: 10,
    title: '기준 사진 촬영',
    render: () => <RoomRefCameraView camera={<RoomRefCameraPreview />} onClose={noop} onShoot={noop} onFlip={noop} />,
  },
  { n: 11, title: '금액 정하기', render: () => <StakeView maxAmount={30000} onChange={noop} onBack={noop} onNext={noop} /> },
  {
    n: 12,
    title: '확인과 카드 등록',
    variant: '카드 없음',
    render: () => <ConfirmView summary={summaryOf(morning)} onBack={noop} onStart={noop} onChangeCard={noop} />,
  },
  {
    n: 12,
    title: '확인과 카드 등록',
    variant: '테스트 결제창',
    render: () => <PgMockView initialCompany="신한카드" onClose={noop} onRegister={noop} onFail={noop} />,
  },
  {
    n: 13,
    title: '확인 (카드 등록 후)',
    render: () => (
      <ConfirmView
        summary={summaryOf(morning)}
        card={card}
        initialChecks={[true, true, true, true]}
        onBack={noop}
        onStart={noop}
        onChangeCard={noop}
      />
    ),
  },
  {
    n: 14,
    title: '카드 등록 실패',
    render: () => (
      <CardFailedView
        purpose="create"
        summary={{ name: '미라클모닝', schedule: '평일 06:00–06:10', stake: stakeRange(30000) }}
        onRetry={noop}
        onLater={noop}
      />
    ),
  },
];
