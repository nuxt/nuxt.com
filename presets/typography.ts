// https://github.com/tailwindlabs/tailwindcss-typography/blob/master/src/styles.js#L1234

export default theme => ({
  DEFAULT: {
    css: {
      h1: {
        color: theme('colors.indigo.900'),
        fontWeight: '700'
      },
      a: {
        color: 'var(--tw-prose-links)',
        textDecoration: 'none'
      },
      pre: {
        margin: '0'
      },
      code: {
        backgroundColor: 'var(--tw-prose-pre-bg)',
        color: 'var(--tw-prose-code)',
        fontWeight: '600',
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
  invert: {
    css: {
      h1: {
        color: theme('colors.indigo.100')
      }
    }
  },
  gray: {
    css: {
      '--tw-prose-pre-bg': theme('colors.gray.50'),
      '--tw-prose-invert-pre-bg': theme('colors.gray.900'),
      '--tw-prose-code': theme('colors.gray.900'),
      '--tw-prose-pre-code': theme('colors.gray.900'),
      '--tw-prose-invert-code': theme('colors.white'),
      '--tw-prose-invert-pre-code': theme('colors.white')
    }
  }
})
