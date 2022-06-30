import colors from './presets/colors'
import typography from './presets/typography'

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
          gradient: [colors.green[400], colors.teal[400], colors.indigoblue[400]]
        },
        background: theme('colors')
      })
    }
  },
  plugins: [
    require('tailwindcss-border-gradient-radius')
  ],
  content: [
    'presets/*.ts',
    'content/**/*.md',
    'editor/**/*.vue'
  ],
  safelist: [12, 24, 36, 48, 60, 72, 84, 96, 108, 120].map(number => `pl-[${number}px]`)
}
