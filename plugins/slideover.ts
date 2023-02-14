export default defineNuxtPlugin((ctx: any) => {
  const visible = ref(false)

  const open = () => (visible.value = true)
  const close = () => (visible.value = false)
  const toggle = () => (visible.value = !visible.value)

  ctx.$router.afterEach(() => setTimeout(close, 50))

  // Watch visible and remove overflow so the scrollbar disappears when menu is opened
  if (process.client) {
    watch(
      visible,
      (isVisible) => {
        const html = document.documentElement

        if (isVisible) {
          html.style.overflow = 'hidden'
        } else {
          setTimeout(() => {
            html.style.overflow = ''
          }, 100) /* had to put it, because of layout shift on leave transition */
        }
      },
      {
        immediate: true
      }
    )
  }

  return {
    provide: {
      menu: {
        visible,
        close,
        open,
        toggle
      }
    }
  }
})
