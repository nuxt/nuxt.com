import NuxtLink from '#app/components/nuxt-link'
import DesignKitHero from '../components/content/resources/design-kit/DesignKitHero.vue'
import DesignKitSection from '../components/content/resources/design-kit/DesignKitSection.vue'
import DesignKitColorCard from '../components/content/resources/design-kit/DesignKitColorCard.vue'
import DesignKitLogoCard from '../components/content/resources/design-kit/DesignKitLogoCard.vue'
import DesignKitCta from '../components/content/resources/design-kit/DesignKitCta.vue'
/**
 * Global nuxt-link issue.
 *
 * It needs to be registered as global otherwise it will break links inside <Content />.
 */

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('NuxtLink', NuxtLink)
  nuxtApp.vueApp.component('DesignKitHero', DesignKitHero)
  nuxtApp.vueApp.component('DesignKitSection', DesignKitSection)
  nuxtApp.vueApp.component('DesignKitColorCard', DesignKitColorCard)
  nuxtApp.vueApp.component('DesignKitLogoCard', DesignKitLogoCard)
  nuxtApp.vueApp.component('DesignKitCta', DesignKitCta)
})
