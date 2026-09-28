import { Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { colors, fonts, letterSpacing, lineHeight, type ColorToken } from '../theme';

type Weight = keyof typeof fonts.body;

type Props = TextProps & {
  size?: number;
  weight?: Weight;
  color?: ColorToken;
  align?: TextStyle['textAlign'];
  /** 줄간격 1.5 (여러 줄 설명 글) */
  body?: boolean;
  /** 자간 -0.02em (제목) / -0.03em (큰 제목) */
  tight?: boolean | 'more';
};

/** 본문 서체 글자. 크기·굵기·색은 토큰으로만 받는다. */
export function Text({
  size = 15,
  weight = 'regular',
  color = 'ink',
  align,
  body,
  tight,
  style,
  ...rest
}: Props) {
  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: fonts.body[weight],
          fontSize: size,
          color: colors[color],
          textAlign: align,
          lineHeight: body ? lineHeight(size, 'body') : undefined,
          letterSpacing: tight
            ? letterSpacing(size, tight === 'more' ? 'tighter' : 'tight')
            : undefined,
        },
        style,
      ]}
    />
  );
}

type DotProps = TextProps & { size: number; color?: ColorToken };

/** 도트 숫자 서체. 숫자·기호만 넣고 한글은 넣지 않는다. */
export function DotText({ size, color = 'ink', style, ...rest }: DotProps) {
  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: fonts.dot,
          fontSize: size,
          lineHeight: lineHeight(size, 'tight') + Math.round(size * 0.12),
          color: colors[color],
          includeFontPadding: false,
        },
        style,
      ]}
    />
  );
}

/** PRO 뱃지 */
export function ProBadge() {
  return (
    <RNText
      style={{
        fontFamily: fonts.mono,
        fontSize: 10,
        letterSpacing: letterSpacing(10, 'wide'),
        color: colors.signal,
        backgroundColor: colors.ink,
        borderRadius: 6,
        overflow: 'hidden',
        paddingHorizontal: 6,
        paddingVertical: 2,
      }}
    >
      PRO
    </RNText>
  );
}
