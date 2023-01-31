import type { Ref } from 'vue'
import type { ResourcesBlogArticle } from '../types'

export const useBlog = () => {
  const articles: Ref<ResourcesBlogArticle[]> = useState('articles', () => [])
  const featuredArticle: Ref<ResourcesBlogArticle | {}> = useState('featured-article', () => {})

  // Data fetching

  async function fetchList () {
    if (articles.value.length) { return }

    try {
      const data = await queryContent<ResourcesBlogArticle>('/blog').where({
        $not: {
          _path: {
            $in: ['/blog']
          }
        },
        _extension: 'md'
      }).sort({ date: -1 }).find()

      articles.value = data as ResourcesBlogArticle[]
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
