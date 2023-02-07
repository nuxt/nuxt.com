import colors, { safeColorsAsRegex } from './ui/colors'
import typography from './ui/typography'

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    colors,
    extend: {
      typography,
      fontFamily: {
        sans: '"RoobertPRO", "RoobertPRO override", sans-serif'
      },
      linearBorderGradients: ({ theme }) => ({
        colors: {
          gray: [theme('colors.gray.900')],
          gradient: [colors.green[400], colors.teal[400], colors.teal[600]]
        },
        background: theme('colors')
      })
    }
  },
  plugins: [
    require('tailwindcss-border-gradient-radius'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/line-clamp'),
    require('@tailwindcss/aspect-ratio')
  ],
  content: [
    'ui/*.ts',
    '.demo/content/**/*.md',
    'content/**/*.md',
  ],
  safelist: [
    ...[12, 24, 36, 48, 60, 72, 84, 96, 108, 120].map(number => `pl-[${number}px]`),
    {
      pattern: /rounded-(sm|md|lg|xl|2xl|3xl)/,
      variants: ['sm']
    },
    {
      pattern: new RegExp(`bg-(${safeColorsAsRegex})-(400|500)`),
      variants: ['hover', 'disabled', 'dark']
    },
    {
      pattern: new RegExp(`ring-(${safeColorsAsRegex})-(400)`),
      variants: ['focus']
    }
  ]
}
