// https://github.com/tailwindlabs/tailwindcss-typography/blob/master/src/styles.js#L1234

export default (theme: (arg0: string) => any) => ({
  DEFAULT: {
    css: {
      h1: {
        fontWeight: theme('fontWeight.semibold')
      },
      h2: {
        fontWeight: theme('fontWeight.semibold')
      },
      h3: {
        fontWeight: theme('fontWeight.semibold')
      },
      h4: {
        fontWeight: theme('fontWeight.semibold')
      },
      'h2, h3, h4': {
        'scroll-margin-top': 'var(--scroll-mt)'
      },
      'h1 a, h2 a, h3 a, h4 a': {
        borderBottom: 'none !important',
        color: 'inherit'
      },
      a: {
        fontWeight: theme('fontWeight.semibold'),
        textDecoration: 'none',
        borderBottom: '1px solid transparent'
      },
      'a:hover': {
        borderColor: 'var(--tw-prose-links)'
      },
      'a code': {
        color: 'inherit',
        fontWeight: 'inherit'
      },
      pre: {
        margin: '0'
      },
      code: {
        backgroundColor: 'var(--tw-prose-code-bg)',
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
  dark: {
    css: {
      a: {
        borderBottomColor: theme('colors.primary.400')
      }
    }
  },
  invert: {
    css: {
      '--tw-prose-code-bg': 'var(--tw-prose-invert-code-bg)'
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
      '--tw-prose-pre-code': theme('colors.gray.200'),
      '--tw-prose-pre-bg': theme('colors.gray.900'), // Default: 'colors.gray.800'
      '--tw-prose-code-bg': theme('colors.gray.50'),
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
      '--tw-prose-invert-pre-code': theme('colors.gray.300'),
      '--tw-prose-invert-pre-bg': theme('colors.gray.900'), // Default: 'rgb(0 0 0 / 50%)'
      '--tw-prose-invert-code-bg': theme('colors.gray.900'),
      '--tw-prose-invert-th-borders': theme('colors.gray.600'),
      '--tw-prose-invert-td-borders': theme('colors.gray.700')
    }
  },
  green: {
    css: {
      '--tw-prose-links': theme('colors.green.400'),
      '--tw-prose-invert-links': theme('colors.green.400')
    }
  }
})
