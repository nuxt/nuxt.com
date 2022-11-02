import colors, { safeColorsAsRegex } from './ui/colors'
import typography from './ui/typography'

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    colors,
    extend: {
      typography,
      fontFamily: {
        sans: '"RoobertPRO", sans-serif'
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
    require('tailwindcss-border-gradient-radius')
  ],
  content: [
    'ui/*.ts',
    'content/**/*.md',
    'editor/**/*.vue'
  ],
  safelist: [
    ...[12, 24, 36, 48, 60, 72, 84, 96, 108, 120].map(number => `pl-[${number}px]`),
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
