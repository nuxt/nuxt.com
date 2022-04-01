import type { RouterOptions } from '@nuxt/schema'

// https://router.vuejs.org/api/#routeroptions
export default <RouterOptions>{
  scrollBehavior: (to, from, savedPosition) => {
    // Apply this scrollBehavior only on `docs/` pages
    if (!to.path.includes('/docs/')) { return }

    // Scroll to top of window
    window.scrollTo({
      top: 0
    })
  }
}
