export default defineAppConfig({
  ui: {
    primary: 'green',
    gray: 'slate'
  },
  uiKit: {
    variables: {
      dark: {
        background: 'var(--color-gray-950)'
      },
      header: {
        height: '5rem'
      }
    },
    header: {
      border: 'border-b border-border -mb-px lg:mb-0 lg:border-0'
    }
  }
})