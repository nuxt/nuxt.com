import type { NotableRelease } from '#shared/types'
import type { BlogPost } from '~/composables/useBlog'

export interface UpdatesTimelineItem {
  key: string
  title: string
  description: string
  date: string
  to: string
  external: boolean
}

const ANNOUNCEMENT_WINDOW = 10 * 24 * 60 * 60 * 1000

/** Releases worth a place on the timeline: majors, Nuxt minors, and minors whose notes have a Highlights section. */
function isFeatured(release: NotableRelease) {
  return release.kind === 'major' || release.repo === 'nuxt/nuxt' || release.highlights.length > 0
}

/** Whether a blog post announces a release, e.g. "Nuxt 4.6" for nuxt v4.6.0. */
function announces(post: BlogPost, release: NotableRelease) {
  if (Math.abs(new Date(post.date).getTime() - new Date(release.date).getTime()) > ANNOUNCEMENT_WINDOW) return false
  const [major, minor] = release.version.split('.')
  const version = release.kind === 'major' ? `${major}(?:\\.0)?` : `${major}\\.${minor}`
  return new RegExp(`\\b${searchTextRegExp(release.product).source} v?${version}(?![.\\d])`, 'i').test(post.title)
}

/** Blog posts and the release timeline. */
export function useUpdates() {
  const { posts, ready: postsReady } = useBlogPosts()
  const releases = useFetch<NotableRelease[]>('/api/releases/notable', {
    key: 'notable-releases',
    default: () => []
  })

  function timelineItem(release: NotableRelease): UpdatesTimelineItem {
    const post = posts.value.find(item => announces(item, release))
    const [major, minor] = release.version.split('.')
    return {
      key: release.url,
      title: `${release.product} ${major}.${minor}`,
      description: post?.description ?? (release.highlights.length
        ? `${release.highlights.join(', ')}.`
        : `Release notes for ${release.product} ${release.version} on GitHub.`),
      date: release.date,
      to: post?.path ?? release.url,
      external: !post
    }
  }

  const timeline = computed(() => releases.data.value.filter(isFeatured).map(timelineItem))

  return {
    posts,
    timeline,
    ready: Promise.all([postsReady, releases])
  }
}
