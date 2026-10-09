import type { BlogSearchDocument, BlogSearchResult, NotableRelease } from '#shared/types'
import type { BlogPost } from '~/composables/useBlog'
import type { PreparedBlogDocument } from '~/utils/blog-search'

export interface BlogSearchMatch {
  post: BlogPost
  result: BlogSearchResult
}

export interface UpdatesTimelineItem {
  key: string
  title: string
  description: string
  date: string
  to: string
  external: boolean
  /** Blog post announcing the release, if any */
  postPath?: string
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

let searchIndexRequest: Promise<PreparedBlogDocument[]> | undefined

/** Loaded once per browser session, the first time someone searches. */
function fetchSearchIndex() {
  searchIndexRequest ??= $fetch<BlogSearchDocument[]>('/api/blog/search-index')
    .then(prepareBlogSearchIndex)
    .catch((error) => {
      searchIndexRequest = undefined
      throw error
    })
  return searchIndexRequest
}

/** Blog posts, the release timeline, and full-text search across both. */
export function useUpdates(query: Ref<string>) {
  const { posts, ready: postsReady } = useBlogPosts()
  const releases = useFetch<NotableRelease[]>('/api/releases/notable', {
    key: 'notable-releases',
    default: () => []
  })

  const searchIndex = shallowRef<PreparedBlogDocument[]>()
  const searchFailed = ref(false)

  function loadSearchIndex() {
    if (import.meta.server || searchIndex.value) return
    fetchSearchIndex()
      .then((index) => {
        searchIndex.value = index
      })
      .catch(() => {
        searchFailed.value = true
      })
  }

  onMounted(() => {
    if (query.value) loadSearchIndex()
  })
  watch(query, (value) => {
    if (value) loadSearchIndex()
  })

  const searchable = computed(() => query.value.trim().length >= BLOG_SEARCH_MIN_LENGTH)

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
      external: !post,
      postPath: post?.path
    }
  }

  const timeline = computed(() => releases.data.value.filter(isFeatured).map(timelineItem))

  const matches = computed((): { articles: BlogSearchMatch[], releases: UpdatesTimelineItem[] } => {
    if (!searchable.value) return { articles: [], releases: [] }
    const terms = splitSearchTerms(query.value)
    const articles = searchBlog(searchIndex.value ?? [], query.value).flatMap((result) => {
      const post = posts.value.find(item => item.path === result.path)
      return post ? [{ post, result }] : []
    })
    const found = new Set(articles.map(({ post }) => post.path))
    return {
      articles,
      releases: releases.data.value
        .filter(release => terms.every(term => `${release.product} ${release.repo} v${release.version} ${release.highlights.join(' ')}`.toLowerCase().includes(term)))
        .map(timelineItem)
        .filter(item => !item.postPath || !found.has(item.postPath))
    }
  })

  return {
    posts,
    timeline,
    matches,
    searchable,
    searching: computed(() => searchable.value && !searchIndex.value && !searchFailed.value),
    loadSearchIndex,
    ready: Promise.all([postsReady, releases])
  }
}
