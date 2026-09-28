/** 7. 헬스장 인증 방식 (+ 8. 헬스장 위치 권한 요청 시트): 헬스장 선택 후 */
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import {
  BottomActions,
  BottomSheet,
  Button,
  Field,
  Header,
  Icon,
  OptionCard,
  Screen,
  SectionLabel,
  Spacer,
  Text,
  TextButton,
  TimeBar,
  TimeSheet,
  Title,
} from '../components';
import { fmtHM } from '../domain/rules';
import { href } from '../lib/routes';
import { go, goHome } from '../lib/nav';
import { useStore } from '../store';
import { isPro as isProSel } from '../store/selectors';
import { colors, radius } from '../theme';
import { ProLockSheet } from './ProLockSheet';

type Method = 'photo' | 'location';

/** 30 → "30분", 90 → "1시간 30분" */
const stayText = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return [h ? `${h}시간` : '', m ? `${m}분` : ''].filter(Boolean).join(' ');
};

export type GymMethodViewProps = {
  method: Method;
  placeName: string;
  stayMinutes: number;
  isPro: boolean;
  /** 위치 권한을 이미 받았는지. 아니면 위치 인증을 고를 때 권한 시트를 띄운다 */
  locationGranted: boolean;
  onChange: (patch: { method?: Method; placeName?: string; stayMinutes?: number }) => void;
  /** "위치 권한 허용하기": 권한을 요청하고 허용 여부를 돌려준다 */
  onRequestLocation: () => Promise<boolean>;
  onNext: () => void;
  onBack: () => void;
  onPro: () => void;
  /** 갤러리용: 처음부터 열어 둘 시트 */
  initialSheet?: 'perm' | 'lock' | 'stay';
};

export function GymMethodView({
  method,
  placeName,
  stayMinutes,
  isPro,
  locationGranted,
  onChange,
  onRequestLocation,
  onNext,
  onBack,
  onPro,
  initialSheet,
}: GymMethodViewProps) {
  const [sheet, setSheet] = useState<'perm' | 'lock' | 'stay' | null>(initialSheet ?? null);
  const [asking, setAsking] = useState(false);
  const location = method === 'location';

  const pickLocation = () => {
    if (!isPro) return setSheet('lock');
    if (!locationGranted) return setSheet('perm');
    onChange({ method: 'location' });
  };

  const allow = async () => {
    if (asking) return;
    setAsking(true);
    const ok = await onRequestLocation().catch(() => false);
    setAsking(false);
    setSheet(null);
    onChange({ method: ok ? 'location' : 'photo' });
  };

  const denyPerm = () => {
    setSheet(null);
    onChange({ method: 'photo' });
  };

  return (
    <Screen
      scroll
      footer={
        <BottomActions>
          <Button label="다음" disabled={location && !placeName.trim()} onPress={onNext} />
        </BottomActions>
      }
      overlay={
        <>
          <ProLockSheet
            visible={sheet === 'lock'}
            onClose={() => setSheet(null)}
            title="헬스장 위치 자동 인증은 프로에서 쓸 수 있어요"
            onStart={() => {
              setSheet(null);
              onPro();
            }}
          />
          <LocationPermissionSheet visible={sheet === 'perm'} busy={asking} onAllow={allow} onClose={denyPerm} />
          <TimeSheet
            visible={sheet === 'stay'}
            title="머무를 시간"
            labels={['시간', '분']}
            duration
            value={{ h: Math.floor(stayMinutes / 60), m: stayMinutes % 60 }}
            onClose={() => setSheet(null)}
            onApply={(v) => {
              onChange({ stayMinutes: Math.max(10, v.h * 60 + v.m) });
              setSheet(null);
            }}
          />
        </>
      }
    >
      <Header onBack={onBack} />
      <View style={{ paddingHorizontal: 4 }}>
        <Title>{'헬스장 인증은\n어떻게 할까요?'}</Title>
      </View>
      <View style={{ gap: 8 }}>
        <OptionCard
          selected={!location}
          onPress={() => onChange({ method: 'photo' })}
          label="사진 인증"
          description="헬스장 안에서 그날의 미션과 함께 찍어요"
        />
        <OptionCard
          selected={location}
          onPress={pickLocation}
          label="위치 자동 인증"
          description="헬스장에 정한 시간만큼 머물면 자동 인증"
          pro
        />
      </View>
      {location ? (
        <>
          <View style={{ gap: 10 }}>
            <SectionLabel>헬스장 위치</SectionLabel>
            <View style={{ justifyContent: 'center' }}>
              <Field
                value={placeName}
                onChangeText={(t) => onChange({ placeName: t })}
                placeholder="헬스장 이름이나 주소"
                returnKeyType="done"
                style={{ paddingLeft: 44 }}
              />
              <View pointerEvents="none" style={{ position: 'absolute', left: 16 }}>
                <Icon name="search" size={18} color={colors.text3} />
              </View>
            </View>
            <MapPlaceholder label={placeName.trim()} />
          </View>
          <View style={{ gap: 10 }}>
            <SectionLabel>머무를 시간</SectionLabel>
            <TimeBar
              label="머무를 시간 바꾸기"
              start={fmtHM({ h: Math.floor(stayMinutes / 60), m: stayMinutes % 60 })}
              onPressStart={() => setSheet('stay')}
            />
            <Text size={13} color="text2" body>
              주황 원 안에 {stayText(stayMinutes)} 이상 머물면 인증돼요. 위치는 인증 시간에만 확인해요.
            </Text>
          </View>
        </>
      ) : null}
      <Spacer />
    </Screen>
  );
}

/** 지도 자리: 주황 원(인증 반경) + 가운데 점 */
function MapPlaceholder({ label }: { label?: string }) {
  return (
    <View
      style={{
        height: 90,
        borderRadius: 16,
        backgroundColor: colors.border,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          position: 'absolute',
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: colors.signalGlow,
          borderWidth: 2,
          borderColor: colors.signal,
        }}
      />
      <View
        style={{
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: colors.ink,
          borderWidth: 3,
          borderColor: colors.surface,
        }}
      />
      {label ? (
        <Text size={12} color="text2" numberOfLines={1} style={{ position: 'absolute', left: 12, bottom: 10, right: 12 }}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const PERM_POINTS = [
  '헬스장에 머문 시간을 재려면, 앱이 꺼져 있어도 위치를 확인해야 해요.',
  '위치는 인증 시간에만 확인하고, 다른 용도로 쓰지 않아요.',
  '허용하지 않으면 사진으로 인증할 수 있어요.',
];

/** 8. 헬스장 위치 권한 요청 (시트) */
export function LocationPermissionSheet({
  visible,
  busy,
  onAllow,
  onClose,
}: {
  visible: boolean;
  busy?: boolean;
  onAllow: () => void;
  /** 닫기·"사진 인증으로 할게요" */
  onClose: () => void;
}) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="위치 권한이 필요해요"
      gap={18}
      footer={
        <>
          <Button label="위치 권한 허용하기" loading={busy} onPress={onAllow} />
          <TextButton label="사진 인증으로 할게요" onPress={onClose} />
        </>
      }
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          padding: 16,
          borderRadius: 16,
          backgroundColor: colors.ink,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.button,
            backgroundColor: colors.inkSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="pin" size={22} color={colors.signal} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text size={15} weight="bold" color="surface">
            위치: 항상 허용
          </Text>
          <Text size={13} color="textOnInk">
            앱을 닫아둬도 머문 시간을 재요
          </Text>
        </View>
      </View>
      <View style={{ gap: 8 }}>
        {PERM_POINTS.map((t) => (
          <View key={t} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <View style={{ width: 6, height: 6, marginTop: 8, borderRadius: 3, backgroundColor: colors.signal }} />
            <Text size={14} color="textBody" body style={{ flex: 1 }}>
              {t}
            </Text>
          </View>
        ))}
      </View>
    </BottomSheet>
  );
}

/** 위치 "항상 허용" 요청. 포그라운드가 허용되면 인증에 쓸 수 있다고 본다 */
async function requestLocation() {
  // 웹에는 백그라운드 위치가 없다. 개발용 흐름이 이어지도록 허용으로 본다
  if (Platform.OS === 'web') return true;
  try {
    const fg = await Location.requestForegroundPermissionsAsync();
    if (!fg.granted) return false;
    try {
      // Expo Go 등 백그라운드 위치를 지원하지 않는 환경에서는 실패할 수 있다
      await Location.requestBackgroundPermissionsAsync();
    } catch {
      // 포그라운드 허용만으로 계속 진행
    }
    return true;
  } catch {
    return false;
  }
}

export default function GymMethodRoute() {
  const draft = useStore((s) => s.draft);
  const pro = useStore(isProSel);
  const locationGranted = useStore((s) => !!s.user?.permissions.location);
  const { startDraft, updateDraft } = useStore.getState();

  // 주소로 바로 들어온 경우에도 헬스장 초안이 있게 한다
  useEffect(() => {
    const d = useStore.getState().draft;
    if (!d || d.kind !== 'gym') startDraft('gym');
  }, [startDraft]);

  const method: Method = draft?.method === 'location' ? 'location' : 'photo';
  const gym = draft?.gym ?? { placeName: '', stayMinutes: 30 };

  return (
    <GymMethodView
      method={method}
      placeName={gym.placeName}
      stayMinutes={gym.stayMinutes}
      isPro={pro}
      locationGranted={locationGranted}
      onChange={(p) => {
        const cur = useStore.getState().draft?.gym ?? gym;
        updateDraft({
          ...(p.method ? { method: p.method } : {}),
          gym: {
            placeName: p.placeName ?? cur.placeName,
            stayMinutes: p.stayMinutes ?? cur.stayMinutes,
          },
        });
      }}
      onRequestLocation={async () => {
        const granted = await requestLocation();
        useStore.getState().grantPermissions({ location: granted });
        return granted;
      }}
      onNext={() => {
        const d = useStore.getState().draft;
        if (d?.gym) updateDraft({ gym: { ...d.gym, placeName: d.gym.placeName.trim() } });
        go(href.stake);
      }}
      onBack={() => (router.canGoBack() ? router.back() : goHome())}
      onPro={() => go(href.pro)}
    />
  );
}
