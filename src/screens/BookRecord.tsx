/** 24. 책읽기 기록: 읽는 책(자동완성) + 오늘의 한 줄(10자 이상) */
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { BottomActions, Button, DotText, Field, Icon, Screen, Text, Title } from '../components';
import { clockSec, shortRemain } from '../domain/rules';
import { href } from '../lib/routes';
import { goHome, replace } from '../lib/nav';
import { useNow, useStore } from '../store';
import { colors, fonts } from '../theme';
import { VerifyClosedView, closedCopy, verifyTitle } from './Verify';
import { acceptsPhoto, missionShort, param } from './VerifyShared';

export const MIN_LINE = 10;

export function BookRecordView({
  uri,
  takenAt,
  now,
  end,
  books,
  initialTitle = '',
  initialLine = '',
  initialOpen = false,
  busy,
  onRetake,
  onSubmit,
}: {
  uri?: string;
  takenAt: number;
  now: number;
  end: number;
  /** 최근에 읽은 책 (자동완성) */
  books: string[];
  initialTitle?: string;
  initialLine?: string;
  /** 갤러리: 자동완성 목록을 펼친 상태로 */
  initialOpen?: boolean;
  busy?: boolean;
  onRetake: () => void;
  onSubmit: (book: { title: string; line: string }) => void;
}) {
  const [q, setQ] = useState(initialTitle);
  const [open, setOpen] = useState(initialOpen);
  const [line, setLine] = useState(initialLine);
  const title = q.trim();
  const len = line.trim().length;
  const ok = title.length > 0 && len >= MIN_LINE;
  const recent = books.filter((b) => !title || b.includes(title) || b === title).slice(0, 4);
  const isNew = title.length > 0 && !books.includes(title);
  const showList = open && (recent.length > 0 || isNew);

  return (
    <Screen
      wide
      gap={20}
      scroll
      footer={<Button label="기록 남기기" disabled={!ok} loading={busy} onPress={() => onSubmit({ title, line: line.trim() })} />}
    >
      <View style={styles.top}>
        <Pressable accessibilityRole="button" onPress={onRetake} style={styles.back}>
          <Icon name="back" size={22} />
          <Text size={15} weight="semibold">
            다시 찍기
          </Text>
        </Pressable>
        <View style={styles.remain}>
          <Text size={12} color="text3">
            남은 시간
          </Text>
          <DotText size={18}>{shortRemain(end - now)}</DotText>
        </View>
      </View>

      <Title>{'오늘 읽은 걸\n한 줄로 남겨주세요'}</Title>

      <View style={styles.photoRow}>
        <View style={styles.thumb}>
          {uri ? (
            <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <Text size={12} color="text2" align="center">
              {'촬영한\n페이지'}
            </Text>
          )}
          <View style={styles.thumbStamp}>
            <DotText size={13} color="signal" style={{ textAlign: 'center' }}>
              {clockSec(takenAt)}
            </DotText>
          </View>
        </View>
        <View style={{ flex: 1, gap: 12 }}>
          <Item label="오늘의 미션" value={missionShort('book', undefined)} />
          <Item label="촬영 시각" value={clockSec(takenAt)} />
        </View>
      </View>

      <View style={[styles.group, { zIndex: 5 }]}>
        <Text size={14} weight="semibold" color="text2">
          읽는 책
        </Text>
        <Field
          value={q}
          placeholder="책 제목을 입력하세요"
          onChangeText={(t) => {
            setQ(t);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          style={{ fontFamily: fonts.body.semibold }}
          autoCorrect={false}
          returnKeyType="next"
        />
        {showList ? (
          <View style={styles.menu}>
            {recent.length > 0 ? (
              <>
                <Text size={12} color="text3" style={styles.menuLabel}>
                  최근에 읽은 책
                </Text>
                {recent.map((b) => (
                  <Pressable
                    key={b}
                    accessibilityRole="button"
                    onPress={() => {
                      setQ(b);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: colors.fill }]}
                  >
                    <Icon name="clock" size={16} color={colors.text3} />
                    <Text size={15} numberOfLines={1} style={{ flex: 1 }}>
                      {b}
                    </Text>
                  </Pressable>
                ))}
              </>
            ) : null}
            {isNew ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setOpen(false)}
                style={({ pressed }) => [
                  styles.menuRow,
                  recent.length > 0 && styles.menuDivider,
                  pressed && { backgroundColor: colors.fill },
                ]}
              >
                <Icon name="plus" size={16} strokeWidth={2.5} />
                <Text size={15} weight="semibold" numberOfLines={1} style={{ flex: 1 }}>
                  ‘{title}’ 새 책으로 추가
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.group}>
        <Text size={14} weight="semibold" color="text2">
          오늘의 한 줄
        </Text>
        <Field
          multiline
          value={line}
          onChangeText={setLine}
          placeholder="기억에 남는 문장이나 생각을 적어주세요"
          maxLength={300}
        />
        <Text size={12} color={len > 0 && len < MIN_LINE ? 'signal' : 'text3'} align="right">
          {len} / {MIN_LINE}자 이상
        </Text>
      </View>
    </Screen>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text size={12} color="text3">
        {label}
      </Text>
      <Text size={15} weight="semibold">
        {value}
      </Text>
    </View>
  );
}

export default function BookRecordRoute() {
  const qp = useLocalSearchParams<{ occ: string; uri: string; takenAt: string }>();
  const occId = param(qp.occ);
  const uri = param(qp.uri);
  const takenAt = Number(qp.takenAt) || 0;
  const now = useNow();
  const o = useStore((s) => s.occurrences[occId]);
  const p = useStore((s) => (o ? s.promises[o.promiseId] : undefined));
  const books = useStore((s) => s.books);
  const [busy, setBusy] = useState(false);

  const takenInside = !!o && takenAt >= o.start && takenAt < o.end;
  if (!o || !p || (!busy && (!takenInside || !acceptsPhoto(o, now)))) {
    const c = closedCopy(o, now);
    return <VerifyClosedView title={verifyTitle(p)} heading={c.heading} sub={c.sub} onClose={goHome} onHome={goHome} />;
  }

  return (
    <BookRecordView
      uri={uri || undefined}
      takenAt={takenAt}
      now={now}
      end={o.end}
      books={books}
      initialTitle={books[0] ?? ''}
      busy={busy}
      onRetake={() => replace(href.camera(occId))}
      onSubmit={(book) => {
        if (busy) return;
        setBusy(true);
        const r = useStore.getState().submitPhoto(occId, { uri: uri || undefined, takenAt, book });
        if (!r) return goHome();
        replace(r.uploaded ? href.judging(r.id) : href.submitError(r.id));
      }}
    />
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, height: 44, marginLeft: -8 },
  remain: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  thumb: {
    width: 120,
    height: 160,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbStamp: { position: 'absolute', left: 8, right: 8, bottom: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.ink },
  group: { gap: 8 },
  menu: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 86,
    padding: 6,
    borderRadius: 14,
    backgroundColor: colors.surface,
    // 자동완성 목록 그림자 (이 화면에서만 쓰는 값, SPEC 5.1)
    shadowColor: colors.ink,
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  menuLabel: { paddingTop: 8, paddingHorizontal: 10, paddingBottom: 4 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, paddingHorizontal: 10, borderRadius: 10 },
  menuDivider: { borderTopWidth: 1, borderTopColor: colors.lineOnSurface, borderRadius: 0 },
});
