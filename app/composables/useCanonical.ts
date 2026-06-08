import { joinURL } from 'ufo'
import { toValue, type MaybeRefOrGetter } from 'vue'
import type { Link } from '@unhead/vue/types'

// Adds a canonical URL for the current route plus, optionally, a
// `rel="alternate"; type="text/markdown"` link pointing at the agent-friendly
// markdown counterpart. Vercel rewrites the public `.md` URLs to the
// underlying `/raw/**` handlers (see `modules/md-rewrite.ts`).
export function useCanonical(markdownAlternate?: MaybeRefOrGetter<string | null | undefined>) {
  const route = useRoute()
  const site = useSiteConfig()

  useHeadSafe({
    link: computed(() => {
      const links: Link[] = [
        { rel: 'canonical', href: joinURL(site.url, route.path) }
      ]

      const md = toValue(markdownAlternate)
      if (md) {
        links.push({ rel: 'alternate', type: 'text/markdown', href: joinURL(site.url, md) })
      }

      return links
    })
  })
}
