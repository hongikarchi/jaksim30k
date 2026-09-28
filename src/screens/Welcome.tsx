/** 1. 시작: 첫 실행, 로그아웃 후 */
import { View, useWindowDimensions } from 'react-native';

import { Button, BottomActions, DotText, Led, Screen, Spacer, Text } from '../components';
import { clock } from '../domain/rules';
import { href } from '../lib/routes';
import { go } from '../lib/nav';
import { useNow } from '../store';
import { colors } from '../theme';

export function WelcomeView({ now, onStart }: { now: number; onStart: () => void }) {
  const { width } = useWindowDimensions();
  // 도트 숫자 104px(5자리). 좁은 화면에서도 카드 안에 한 줄로 들어가게 줄인다
  const digitSize = Math.min(104, Math.floor((Math.min(width, 430) - 48 - 56) / (5 * 0.55)));
  return (
    <Screen
      wide
      topGap="wide"
      gap={32}
      footer={
        <BottomActions>
          <Button label="시작하기" onPress={onStart} />
        </BottomActions>
      }
    >
      <View
        style={{
          width: '100%',
          aspectRatio: 1,
          maxHeight: 342,
          alignSelf: 'center',
          borderRadius: 36,
          backgroundColor: colors.ink,
          padding: 28,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text size={13} weight="semibold" color="textOnInk">
            지금 시각
          </Text>
          <Led state="glow" size={10} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 18 }}>
          <DotText size={digitSize} color="signal" numberOfLines={1}>
            {clock(now)}
          </DotText>
        </View>
      </View>
      <View style={{ gap: 12 }}>
        <Text size={32} weight="bold" tight="more" style={{ lineHeight: 40 }}>
          {'일어나지 못하면,\n돈이 나갑니다.'}
        </Text>
        <Text size={16} color="text2" body>
          {'약속을 어긴 날에만 결제돼요.\n지키면 한 푼도 나가지 않아요.'}
        </Text>
      </View>
      <Spacer />
    </Screen>
  );
}

export default function WelcomeRoute() {
  const now = useNow();
  return <WelcomeView now={now} onStart={() => go(href.login)} />;
}
