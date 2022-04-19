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
      }
    }
  },
  invert: {
    css: {
      h1: {
        color: theme('colors.indigo.100')
      }
    }
  }
})
