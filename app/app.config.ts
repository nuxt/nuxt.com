export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'slate',
      important: 'violet'
    }
  },
  uiPro: {
    prose: {
      img: {
        base: 'w-full'
      },
      codeTree: {
        slots: {
          root: 'bg-(--ui-bg) m-0'
        }
      }
    }
  }
})
