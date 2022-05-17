// https://github.com/tailwindlabs/tailwindcss-typography/blob/master/src/styles.js#L1234

export default theme => ({
  DEFAULT: {
    css: {
      h1: {
        fontWeight: '600'
      },
      a: {
        textDecoration: 'none'
      },
      pre: {
        margin: '0'
      },
      code: {
        backgroundColor: 'var(--tw-prose-pre-bg)',
        padding: '0.25rem 0.375rem',
        borderRadius: '0.375rem'
      },
      'code::before': {
        content: ''
      },
      'code::after': {
        content: ''
      }
    }
  },
  // TailwindCSS uses imported colors instead of the theme: https://github.com/tailwindlabs/tailwindcss-typography/blob/master/src/styles.js#L964
  gray: {
    css: {
      '--tw-prose-body': theme('colors.gray.700'),
      '--tw-prose-headings': theme('colors.gray.900'),
      '--tw-prose-lead': theme('colors.gray.600'),
      '--tw-prose-links': theme('colors.gray.900'),
      '--tw-prose-bold': theme('colors.gray.900'),
      '--tw-prose-counters': theme('colors.gray.500'),
      '--tw-prose-bullets': theme('colors.gray.300'),
      '--tw-prose-hr': theme('colors.gray.200'),
      '--tw-prose-quotes': theme('colors.gray.900'),
      '--tw-prose-quote-borders': theme('colors.gray.200'),
      '--tw-prose-captions': theme('colors.gray.500'),
      '--tw-prose-code': theme('colors.gray.900'),
      '--tw-prose-pre-code': theme('colors.gray.900'), // Default: 'colors.gray.200'
      '--tw-prose-pre-bg': theme('colors.gray.50'), // Default: 'colors.gray.800'
      '--tw-prose-th-borders': theme('colors.gray.300'),
      '--tw-prose-td-borders': theme('colors.gray.200'),
      '--tw-prose-invert-body': theme('colors.gray.300'),
      '--tw-prose-invert-headings': theme('colors.white'),
      '--tw-prose-invert-lead': theme('colors.gray.400'),
      '--tw-prose-invert-links': theme('colors.white'),
      '--tw-prose-invert-bold': theme('colors.white'),
      '--tw-prose-invert-counters': theme('colors.gray.400'),
      '--tw-prose-invert-bullets': theme('colors.gray.600'),
      '--tw-prose-invert-hr': theme('colors.gray.700'),
      '--tw-prose-invert-quotes': theme('colors.gray.100'),
      '--tw-prose-invert-quote-borders': theme('colors.gray.700'),
      '--tw-prose-invert-captions': theme('colors.gray.400'),
      '--tw-prose-invert-code': theme('colors.white'),
      '--tw-prose-invert-pre-code': theme('colors.white'), // Default: 'colors.gray.300'
      '--tw-prose-invert-pre-bg': theme('colors.gray.900'), // Default: 'rgb(0 0 0 / 50%)'
      '--tw-prose-invert-th-borders': theme('colors.gray.600'),
      '--tw-prose-invert-td-borders': theme('colors.gray.700')
    }
  }
})
