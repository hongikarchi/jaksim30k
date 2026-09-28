import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '../theme';

/** 와이어프레임에 쓰인 선 아이콘 모음 (24×24 기준, 둥근 선) */
const shapes = {
  check: <Path d="M20 6L9 17l-5-5" />,
  back: <Path d="M15 18l-6-6 6-6" />,
  chevronRight: <Path d="M9 18l6-6-6-6" />,
  close: (
    <>
      <Path d="M18 6L6 18" />
      <Path d="M6 6l12 12" />
    </>
  ),
  flip: (
    <>
      <Path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" />
      <Path d="M4 4v4h4" />
      <Path d="M4 13a8 8 0 0 0 14.3 4.9L20 16" />
      <Path d="M20 20v-4h-4" />
    </>
  ),
  plus: (
    <>
      <Path d="M12 5v14" />
      <Path d="M5 12h14" />
    </>
  ),
  info: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 8v5" />
      <Path d="M12 16h.01" />
    </>
  ),
  user: (
    <>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  bell: (
    <>
      <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </>
  ),
  card: (
    <>
      <Rect x="3" y="6" width="18" height="13" rx="2" />
      <Path d="M3 10h18" />
    </>
  ),
  cardFailed: (
    <>
      <Rect x="3" y="6" width="18" height="13" rx="2" />
      <Path d="M3 10h18" />
      <Path d="M8 15h3" />
    </>
  ),
  clock: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7v5l3 2" />
    </>
  ),
  camera: (
    <>
      <Path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <Circle cx="12" cy="13" r="3.5" />
    </>
  ),
  shield: <Path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" />,
  search: (
    <>
      <Circle cx="11" cy="11" r="7" />
      <Path d="M20 20l-3.5-3.5" />
    </>
  ),
  pin: (
    <>
      <Path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
      <Circle cx="12" cy="10" r="2.5" />
    </>
  ),
} as const;

export type IconName = keyof typeof shapes;

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function Icon({ name, size = 20, color = colors.ink, strokeWidth = 2 }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {shapes[name]}
    </Svg>
  );
}
