import type { Ref } from 'vue'
import type { ResourcesBlogArticle } from '../types'

export function useBlog () {
  const articles: Ref<ResourcesBlogArticle[]> = useState('articles', () => [])
  const featuredArticle: Ref<ResourcesBlogArticle | {}> = useState('featured-article', () => ({}))

  // Data fetching

  async function fetchList () {
    if (articles.value.length) { return }

    try {
      const data = await queryContent<ResourcesBlogArticle>('/blog').where({
        _extension: 'md'
      }).without(['body', 'excerpt']).sort({ date: -1 }).find()

      articles.value = (data as ResourcesBlogArticle[]).filter(article => article._path !== '/blog')
      featuredArticle.value = articles.value?.shift() || {}
    } catch (e) {
      articles.value = []
      return e
    }
  }

  return {
    articles,
    featuredArticle,
    fetchList
  }
}
