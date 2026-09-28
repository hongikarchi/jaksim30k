/**
 * PG 결제창 흉내 (개발용). 실제 서비스에서는 PG사의 빌링키 발급 창이 뜬다.
 * 카드 번호는 절대 받지 않는다 (CLAUDE.md). 카드사만 골라 가짜 빌링키를 만든다.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { BottomActions, Button, Header, InfoCard, OptionCard, Screen, TextButton, Title } from '../components';
import { goHome, replace } from '../lib/nav';
import { href } from '../lib/routes';
import { useStore } from '../store';

export const CARD_COMPANIES = [
  '신한카드',
  '삼성카드',
  '현대카드',
  'KB국민카드',
  '롯데카드',
  '하나카드',
  '우리카드',
  'BC카드',
  'NH농협카드',
];

export function PgMockView({
  initialCompany,
  onClose,
  onRegister,
  onFail,
}: {
  initialCompany?: string;
  /** × : 취소로 본다 */
  onClose: () => void;
  onRegister: (company: string) => void;
  onFail: () => void;
}) {
  const [company, setCompany] = useState<string | undefined>(initialCompany);
  return (
    <Screen
      scroll
      gap={16}
      footer={
        <BottomActions>
          <TextButton label="실패해 보기" onPress={onFail} />
          <Button label="카드 등록하기" disabled={!company} onPress={() => company && onRegister(company)} />
        </BottomActions>
      }
    >
      <Header onBack={onClose} close title="테스트 결제창" center />
      <Title sub="실제 결제는 일어나지 않아요. 자동결제에 쓸 카드사만 골라주세요.">카드사 선택</Title>
      <InfoCard icon="shield" muted>
        카드 번호는 작심삼만원이 받지 않아요. 실제 서비스에서는 카드사 결제창에서 입력해요.
      </InfoCard>
      <View style={{ gap: 8 }}>
        {CARD_COMPANIES.map((c) => (
          <OptionCard key={c} label={c} selected={company === c} onPress={() => setCompany(c)} />
        ))}
      </View>
    </Screen>
  );
}

export default function PgMockRoute() {
  const { purpose: p } = useLocalSearchParams<{ purpose?: string }>();
  const purpose = p === 'change' ? 'change' : 'create';
  return (
    <PgMockView
      onClose={() => replace(href.cardFailed(purpose))}
      onFail={() => replace(href.cardFailed(purpose))}
      onRegister={(company) => {
        const s = useStore.getState();
        s.registerCard(company);
        if (purpose === 'create') {
          useStore.getState().createPromise();
          goHome();
        } else {
          router.back();
        }
      }}
    />
  );
}
