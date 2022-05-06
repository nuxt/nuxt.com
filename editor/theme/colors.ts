import type { Color } from '@milkdown/design-system'

export type ColorSet = Record<Color, string>

export const Nord = {
  gray0: '#fafafa',
  gray1: '#f4f4f5',
  gray2: '#e4e4e7',
  gray3: '#d4d4d8',
  gray4: '#a1a1aa',
  gray5: '#71717a',
  gray6: '#52525b',
  gray7: '#3f3f46',
  gray8: '#27272a',
  gray9: '#18181b',
  primary: '#00DC82',
  secondary: '#36E4DA'
}

export const lightColors: ColorSet = {
  shadow: Nord.gray1,
  primary: Nord.primary,
  secondary: Nord.gray3,
  neutral: Nord.gray7,
  solid: Nord.gray5,
  line: Nord.gray2,
  background: Nord.gray1,
  surface: '#fff'
}

export const darkColors: ColorSet = {
  shadow: Nord.gray1,
  primary: Nord.primary,
  secondary: Nord.gray7,
  neutral: Nord.gray2,
  solid: Nord.gray4,
  line: Nord.gray8,
  background: Nord.gray8,
  surface: '#000'
}
