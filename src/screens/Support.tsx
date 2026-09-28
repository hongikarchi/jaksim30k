/** 48. 약관과 문의: 계정, 이의제기 거절에서 */
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { BottomSheet, Button, Header, ListCard, Screen, SettingRow, Tag, Text } from '../components';
import { colors } from '../theme';
import { goHome } from '../lib/nav';

type Doc = { title: string; body: string[]; draft?: boolean };

const FAQ: Doc[] = [
  {
    title: '결제는 언제 되나요?',
    body: [
      '인증 창 안에 인증하지 못한 날에만 결제돼요. 지킨 날에는 한 푼도 나가지 않아요.',
      '결제는 인증 창이 닫히고 24시간 뒤에 등록된 카드로 돼요. 그 전까지 이의제기할 수 있어요.',
      '금액은 첫 번째 놓친 날 0원(연습), 두 번째 5,000원, 세 번째 10,000원, 네 번째부터 정해둔 최대 금액이에요.',
    ],
  },
  {
    title: '이의제기는 어떻게 처리되나요?',
    body: [
      '앱·카메라 오류로 인증하지 못했다면 확인 없이 바로 결제를 취소하고 지킨 날로 기록해요.',
      '그 외 사유는 접수 후 12시간 안에 사람이 검토하고, 그동안 결제는 보류돼요. 받아들여지지 않으면 이유를 알려드리고 12시간 뒤 결제돼요.',
    ],
  },
  {
    title: '약속을 끝내고 싶어요',
    body: [
      '약속 상세에서 약속 끝내기를 누르면 바로 끝나고, 그 뒤로는 결제되지 않아요.',
      '잠깐 쉬고 싶다면 쉬어가기(한 달 1번, 프로는 4번)나 금액 낮추기도 있어요.',
    ],
  },
];

const DRAFT = '정식 약관은 출시 전에 준비돼요. 지금 보이는 글은 초안이에요.';

const TERMS: Doc[] = [
  {
    title: '이용약관',
    draft: true,
    body: [
      '작심삼만원은 정해둔 인증 창 안에 인증하지 못한 날에만 약정 금액을 결제하는 습관 약속 서비스예요.',
      '만 19세 이상만 가입할 수 있고, 카드는 계정당 1장을 모든 약속에 함께 써요.',
    ],
  },
  {
    title: '자동결제 약관',
    draft: true,
    body: [
      '카드는 PG사의 자동결제(빌링키)로 등록돼요. 카드 번호는 앱과 작심삼만원 서버에 저장하지 않아요.',
      '놓친 날의 약정 이용료는 인증 창 마감 24시간 뒤 결제되고, 프로 구독료는 스토어 인앱결제로 따로 결제돼요.',
    ],
  },
  {
    title: '개인정보 처리방침',
    draft: true,
    body: [
      '인증 사진, 위치 기록, 감시자 연락처는 판정과 이의제기 처리에만 써요.',
      '보관 기간은 출시 전에 정해서 이곳에 알려드릴게요.',
    ],
  },
  {
    title: '실패금 안내',
    draft: true,
    body: [
      '놓친 날 결제되는 금액(실패금)은 전부 작심삼만원의 매출이 돼요.',
      '다른 사용자에게 나눠주거나 기부하지 않고, 실패금을 깎아주는 상품도 팔지 않아요.',
    ],
  },
  {
    title: '환불·이의제기 정책',
    draft: true,
    body: [
      '앱·카메라 오류로 놓친 날은 바로 결제를 취소해요. 그 외 사유는 12시간 안에 검토해요.',
      '검토 결과에 이의가 있으면 문의로 알려주세요.',
    ],
  },
];

export function SupportView({
  version,
  onBack,
  initialDoc,
  initialContact,
}: {
  version: string;
  onBack: () => void;
  /** 갤러리용: 처음부터 열어둘 글 제목 */
  initialDoc?: string;
  initialContact?: boolean;
}) {
  const all = [...FAQ, ...TERMS];
  const [doc, setDoc] = useState<Doc | undefined>(all.find((d) => d.title === initialDoc));
  const [contact, setContact] = useState(!!initialContact);

  return (
    <Screen
      scroll
      overlay={
        <>
          <BottomSheet
            visible={!!doc}
            onClose={() => setDoc(undefined)}
            title={doc?.title ?? ''}
            footer={<Button label="확인" onPress={() => setDoc(undefined)} />}
          >
            {doc?.draft ? (
              <View style={{ alignSelf: 'flex-start' }}>
                <Tag label="초안" tone="fill" />
              </View>
            ) : null}
            {doc?.body.map((p) => (
              <Text key={p} size={15} color="textBody" body>
                {p}
              </Text>
            ))}
            {doc?.draft ? (
              <Text size={13} color="text2" body>
                {DRAFT}
              </Text>
            ) : null}
          </BottomSheet>
          <BottomSheet
            visible={contact}
            onClose={() => setContact(false)}
            title="문의 채널은 준비 중이에요"
            footer={<Button label="확인" onPress={() => setContact(false)} />}
          >
            <Text size={15} color="text2" body>
              출시 전에 카카오톡 채널과 이메일 문의를 열어둘게요. 그 전까지는 자주 묻는 질문을 먼저 확인해 주세요.
            </Text>
          </BottomSheet>
        </>
      }
    >
      <Header onBack={onBack} title="약관과 문의" />

      <View style={{ gap: 12, padding: 20, borderRadius: 22, backgroundColor: colors.ink }}>
        <View style={{ gap: 4 }}>
          <Text size={17} weight="bold" color="surface">
            도움이 필요하세요?
          </Text>
          <Text size={13} color="textOnInk">
            운영 시간은 출시 전에 알려드릴게요
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <ContactButton label="카카오톡 문의" light onPress={() => setContact(true)} />
          <ContactButton label="이메일 문의" onPress={() => setContact(true)} />
        </View>
      </View>

      <ListCard title="자주 묻는 질문">
        {FAQ.map((d, i) => (
          <SettingRow key={d.title} label={d.title} onPress={() => setDoc(d)} last={i === FAQ.length - 1} />
        ))}
      </ListCard>

      <ListCard title="약관">
        {TERMS.map((d, i) => (
          <SettingRow key={d.title} label={d.title} onPress={() => setDoc(d)} last={i === TERMS.length - 1} />
        ))}
      </ListCard>

      <Text size={12} color="text3" style={{ paddingHorizontal: 4, paddingTop: 6 }}>
        버전 {version}
      </Text>
    </Screen>
  );
}

function ContactButton({ label, light, onPress }: { label: string; light?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: light ? colors.surface : colors.inkSoft,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text size={14} weight="semibold" color={light ? 'ink' : 'surface'}>
        {label}
      </Text>
    </Pressable>
  );
}

/** 바로 들어온 경우(알림·개발용 주소) 뒤로 갈 곳이 없으면 홈으로 */
const back = () => (router.canGoBack() ? router.back() : goHome());

export default function SupportRoute() {
  return <SupportView version={Constants.expoConfig?.version ?? '1.0.0'} onBack={back} />;
}
