import type { RouterConfig } from '@nuxt/schema'

// https://router.vuejs.org/api/#routeroptions
export default <RouterConfig>{
  scrollBehavior: () => {
    // Scroll to top of window
    window.scrollTo({
      top: 0
    })
  }
}
