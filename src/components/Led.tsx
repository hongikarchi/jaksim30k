import { View } from 'react-native';

import { colors } from '../theme';

export type LedState = 'glow' | 'on' | 'ink' | 'white' | 'off' | 'dim';

/** LED 점. glow = 창 열림(주황 + 빛 번짐), off = 꺼짐(회색 테두리) */
export function Led({ state, size = 10 }: { state: LedState; size?: number }) {
  const r = size / 2;
  if (state === 'off')
    return (
      <View
        style={{ width: size, height: size, borderRadius: r, borderWidth: 2, borderColor: colors.ledOff }}
      />
    );
  const bg = {
    glow: colors.signal,
    on: colors.signal,
    ink: colors.ink,
    white: colors.surface,
    dim: colors.inkRaised,
  }[state];
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: r, backgroundColor: bg },
        state === 'glow' && {
          // 빛 번짐: 레이아웃에 영향 없는 4px 반투명 주황 외곽선
          outlineColor: colors.signalGlow,
          outlineWidth: 4,
          outlineStyle: 'solid',
        },
      ]}
    />
  );
}
