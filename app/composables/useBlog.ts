import type { BlogArticle, BlogCategory } from '#shared/types'

export const useBlog = () => {
  const { data: articles, refresh } = useAsyncData<BlogArticle[]>('blog', async () => {
    const items = await listByDir<BlogArticle>('/blog')

    return items
      .filter(article => article.extension !== '.yml')
      .sort((a, b) => String(b.date).localeCompare(String(a.date))) as BlogArticle[]
  }, { default: () => [] })

  async function fetchList() {
    if (!articles.value?.length) {
      return refresh()
    }
  }

  return {
    articles,
    // featuredArticle,
    fetchList
  }
}

export type BlogPost = Pick<BlogArticle, 'path' | 'title' | 'description' | 'date' | 'image'> & {
  category: BlogCategory
  readingTime?: number
}

/** Categories in tab order, with the slug used in `?category=` and their plural label. */
export const BLOG_CATEGORIES: Array<{ value: BlogCategory, slug: string, label: string }> = [
  { value: 'Release', slug: 'release', label: 'Releases' },
  { value: 'Engineering', slug: 'engineering', label: 'Engineering' },
  { value: 'Ecosystem', slug: 'ecosystem', label: 'Ecosystem' },
  { value: 'Announcement', slug: 'announcement', label: 'Announcements' }
]

/** Blog posts with their reading time, newest first. */
export function useBlogPosts() {
  const { articles, fetchList } = useBlog()
  const readingTimes = useFetch<Record<string, number>>('/api/blog/reading-times', {
    key: 'blog-reading-times',
    default: () => ({})
  })

  const posts = computed(() => articles.value
    .filter(article => article.extension === '.md')
    .map((article): BlogPost => ({
      path: article.path,
      title: article.title,
      description: article.description,
      date: article.date,
      image: article.image,
      category: article.category ?? 'Release',
      readingTime: readingTimes.data.value[article.path]
    }))
  )

  return {
    posts,
    ready: Promise.all([fetchList(), readingTimes])
  }
}
