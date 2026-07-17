import { joinURL } from 'ufo'

interface UseNuxiChatSeoOptions {
  title?: MaybeRef<string | null>
  description?: string
}

const DEFAULT_DESCRIPTION = 'Nuxi helps you explore the documentation — ask about Nuxt, modules, deployment, and more.'

export function useNuxiChatSeo(options: UseNuxiChatSeoOptions = {}) {
  const site = useSiteConfig()
  const title = computed(() => toValue(options.title) || 'Nuxi')
  const description = options.description ?? DEFAULT_DESCRIPTION
  const ogImage = joinURL(site.url, '/nuxt-agent.jpg')

  useHead({ title: () => title.value })
  useSeoMeta({
    ogTitle: () => `${title.value} · Nuxt`,
    ogDescription: description,
    ogImage,
    twitterTitle: () => `${title.value} · Nuxt`,
    twitterDescription: description,
    twitterImage: ogImage
  })
  useCanonical()
}
