import type { BlogArticle } from '~/types'

export const useBlog = () => {
  const articles = useState<BlogArticle[]>('articles', () => [])
  // const featuredArticle: Ref<BlogArticle | {}> = useState('featured-article', () => ({}))

  // Data fetching

  async function fetchList() {
    if (articles.value.length) {
      return
    }

    try {
      const { data: posts } = await useAsyncData('posts', async () => {
        return queryCollection('blog')
          .where('extension', '=', 'md')
          /* .select('title', 'date', 'image', 'description', 'path', 'authors', 'category') */
          .order('date', 'DESC')
          .all()
      })

      articles.value = posts.value?.filter(article => article.path !== '/blog') || []
      // featuredArticle.value = articles.value?.shift() || {}
    } catch (e) {
      articles.value = []
      return e
    }
  }

  return {
    articles,
    // featuredArticle,
    fetchList
  }
}
