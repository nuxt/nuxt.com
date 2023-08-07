import type { Ref } from 'vue'
import type { BlogArticle } from '../types'

export function useBlog () {
  const articles: Ref<BlogArticle[]> = useState('articles', () => [])
  // const featuredArticle: Ref<BlogArticle | {}> = useState('featured-article', () => ({}))

  // Data fetching

  async function fetchList () {
    if (articles.value.length) { return }

    try {
      const data = await queryContent<BlogArticle>('/blog').where({
        _extension: 'md'
      }).without(['body', 'excerpt']).sort({ date: -1 }).find()

      articles.value = (data as BlogArticle[]).filter(article => article._path !== '/blog')
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
