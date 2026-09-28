/** 35. 이의제기: 사유 고르기 + 설명 */
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { BottomActions, Button, Field, Header, OptionCard, Screen, SectionLabel, Tag, Text, Title } from '../components';
import type { DisputeReason } from '../domain/types';
import { href } from '../lib/routes';
import { goHome, replace } from '../lib/nav';
import { useStore } from '../store';
import { colors } from '../theme';
import { DISPUTE_REASONS, NotFound, backOrHome, paramOf } from './outcomeParts';

export function DisputeView({
  initialReason = 'app_error',
  initialNote = '',
  onBack,
  onSubmit,
}: {
  initialReason?: DisputeReason;
  initialNote?: string;
  onBack: () => void;
  onSubmit: (reason: DisputeReason, note: string) => void;
}) {
  const [reason, setReason] = useState<DisputeReason>(initialReason);
  const [note, setNote] = useState(initialNote);
  const needNote = reason === 'other';
  const ready = !needNote || note.trim().length > 0;

  return (
    <Screen
      wide
      gap={22}
      scroll
      footer={
        <BottomActions caption={ready ? undefined : '기타를 고르면 설명을 꼭 적어주세요'}>
          <Button label="제출하기" disabled={!ready} onPress={() => onSubmit(reason, note.trim())} />
        </BottomActions>
      }
    >
      <Header onBack={onBack} />
      <Title>무슨 일이 있었나요?</Title>
      <View accessibilityRole="radiogroup" accessibilityLabel="이의제기 사유" style={{ gap: 8 }}>
        {DISPUTE_REASONS.map((r) => (
          <OptionCard
            key={r.id}
            selected={reason === r.id}
            onPress={() => setReason(r.id)}
            label={r.label}
            right={r.id === 'app_error' ? <Tag label="바로 취소" /> : undefined}
          />
        ))}
      </View>
      <View style={{ gap: 8 }}>
        <SectionLabel>{needNote ? '자세한 설명 (꼭 적어주세요)' : '자세한 설명 (선택)'}</SectionLabel>
        <Field
          multiline
          numberOfLines={3}
          value={note}
          onChangeText={setNote}
          placeholder="어떤 상황이었는지 알려주세요"
          maxLength={500}
        />
      </View>
      <View style={{ gap: 10, paddingVertical: 16, paddingHorizontal: 18, borderRadius: 14, backgroundColor: colors.surface }}>
        <ExplainRow head="오류" body="확인 없이 바로 결제를 취소해요." />
        <ExplainRow head="그 외" body="12시간 안에 사람이 확인하고 결과를 알려드려요. 그동안 결제는 멈춰 있어요." />
      </View>
    </Screen>
  );
}

function ExplainRow({ head, body }: { head: string; body: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <Text size={14} weight="bold" style={{ lineHeight: 20 }}>
        {head}
      </Text>
      <Text size={14} color="text2" style={{ flex: 1, lineHeight: 20 }}>
        {body}
      </Text>
    </View>
  );
}

export default function DisputeRoute() {
  const occ = paramOf(useLocalSearchParams<{ occ: string }>().occ);
  const o = useStore((s) => s.occurrences[occ]);
  const existing = useStore((s) => (o?.disputeId ? s.disputes[o.disputeId] : undefined));

  const submitted = useRef(false);

  // 이미 낸 이의제기가 있으면 그 결과 화면으로
  useEffect(() => {
    if (!existing || submitted.current) return;
    replace(existing.status === 'reviewing' ? href.disputeSubmitted(existing.id) : href.disputeResult(existing.id));
  }, [existing?.id]);

  if (!o) return <NotFound onHome={goHome} />;
  return (
    <DisputeView
      onBack={backOrHome}
      onSubmit={(reason, note) => {
        submitted.current = true;
        const id = useStore.getState().fileDispute(occ, reason, note);
        replace(reason === 'app_error' ? href.disputeResult(id) : href.disputeSubmitted(id));
      }}
    />
  );
}
