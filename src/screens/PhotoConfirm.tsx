/** 23. 사진 확인 (공통): 다시 찍기 / 이 사진으로 제출 */
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { Button, CameraFrame, CameraPlaceholder, DotText, Text } from '../components';
import { clockSec, shortRemain } from '../domain/rules';
import { href } from '../lib/routes';
import { goHome, replace } from '../lib/nav';
import { useNow, useStore } from '../store';
import { VerifyClosedView, closedCopy, verifyTitle } from './Verify';
import { acceptsPhoto, param } from './VerifyShared';

export function PhotoConfirmView({
  title,
  mission,
  uri,
  takenAt,
  now,
  end,
  busy,
  onClose,
  onRetake,
  onSubmit,
}: {
  title: string;
  mission?: string;
  uri?: string;
  takenAt: number;
  now: number;
  end: number;
  busy?: boolean;
  onClose: () => void;
  onRetake: () => void;
  onSubmit: () => void;
}) {
  return (
    <CameraFrame
      title={title}
      onClose={onClose}
      mission={mission}
      stamp={clockSec(takenAt)}
      stampCaption="미션이 잘 보이는지 확인해 주세요"
      bottom={
        <View style={styles.bottom}>
          <View style={styles.remain}>
            <Text size={12} color="textOnInk">
              남은 시간
            </Text>
            <DotText size={18} color="surface">
              {shortRemain(end - now)}
            </DotText>
          </View>
          <View style={styles.buttons}>
            <Button label="다시 찍기" variant="dark" onPress={onRetake} style={styles.flex} />
            <Button label="이 사진으로 제출" variant="white" onPress={onSubmit} loading={busy} style={styles.flex} />
          </View>
        </View>
      }
    >
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <CameraPlaceholder text="방금 찍은 사진" />
      )}
    </CameraFrame>
  );
}

export default function PhotoConfirmRoute() {
  const q = useLocalSearchParams<{ occ: string; uri: string; takenAt: string }>();
  const occId = param(q.occ);
  const uri = param(q.uri);
  const takenAt = Number(q.takenAt) || 0;
  const now = useNow();
  const o = useStore((s) => s.occurrences[occId]);
  const p = useStore((s) => (o ? s.promises[o.promiseId] : undefined));
  const [busy, setBusy] = useState(false);
  const title = verifyTitle(p);

  // 창이 닫혔거나 이미 처리된 창이면 제출할 수 없다 (제출 직후 이동 전에는 그대로 둔다)
  const takenInside = !!o && takenAt >= o.start && takenAt < o.end;
  if (!o || !p || (!busy && (!takenInside || !acceptsPhoto(o, now)))) {
    const c = closedCopy(o, now);
    return <VerifyClosedView title={title} heading={c.heading} sub={c.sub} onClose={goHome} onHome={goHome} />;
  }

  const submit = () => {
    if (busy) return;
    if (p.kind === 'book') return replace(href.bookRecord(occId, uri, takenAt));
    setBusy(true);
    const r = useStore.getState().submitPhoto(occId, { uri: uri || undefined, takenAt });
    if (!r) return goHome();
    replace(r.uploaded ? href.judging(r.id) : href.submitError(r.id));
  };

  return (
    <PhotoConfirmView
      title={title}
      mission={o.mission}
      uri={uri || undefined}
      takenAt={takenAt}
      now={now}
      end={o.end}
      busy={busy}
      onClose={goHome}
      onRetake={() => replace(href.camera(occId))}
      onSubmit={submit}
    />
  );
}

const styles = StyleSheet.create({
  bottom: { height: 96, justifyContent: 'flex-end', gap: 10 },
  remain: { flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline', gap: 6 },
  buttons: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
});
