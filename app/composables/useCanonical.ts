import { withoutTrailingSlash } from 'ufo'
import { toValue, type MaybeRefOrGetter } from 'vue'

// Adds a canonical URL for the current route plus, optionally, a
// `rel="alternate"; type="text/markdown"` link pointing at the agent-friendly
// markdown counterpart. Vercel rewrites the public `.md` URLs to the
// underlying `/raw/**` handlers (see `modules/md-rewrite.ts`).
export function useCanonical(markdownAlternate?: MaybeRefOrGetter<string | null | undefined>) {
  const route = useRoute()
  const site = useSiteConfig()

  useHead({
    link: computed(() => {
      const url = withoutTrailingSlash(site.url)
      const path = route.path === '/' ? '' : route.path.replace(/\/$/, '')

      const links: Array<{ rel: string, href: string, type?: string }> = [
        { rel: 'canonical', href: `${url}${path}` }
      ]

      const md = toValue(markdownAlternate)
      if (md) {
        const href = md.startsWith('http') ? md : `${url}${md.startsWith('/') ? md : `/${md}`}`
        links.push({ rel: 'alternate', type: 'text/markdown', href })
      }

      return links
    })
  })
}
