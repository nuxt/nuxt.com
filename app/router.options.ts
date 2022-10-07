import type { RouterConfig } from '@nuxt/schema'

// https://router.vuejs.org/api/#routeroptions
export default <RouterConfig>{
  scrollBehavior: (to, _from, savedPosition) => {
    if (to.params?.stop) {
      return
    }
    if (history.state.smooth) {
      return {
        el: history.state.smooth,
        behavior: 'smooth'
      }
    }
    if (to.hash) {
      const el = document.querySelector(to.hash)
      // vue-router does not incorporate scroll-margin-top on its own.
      if (el) {
        const top = parseFloat(getComputedStyle(el).scrollMarginTop)
        return {
          el: to.hash,
          behavior: 'smooth',
          top
        }
      }

      return {
        el: to.hash,
        behavior: 'smooth'
      }
    }

    // Scroll to top of window
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
}
