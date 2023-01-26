import type { Ref } from 'vue'
import type { ResourcesBlogArticle } from '../types'

export const useBlog = () => {
  const articles: Ref<ResourcesBlogArticle[]> = useState('articles', () => [])
  const featuredArticle: Ref<ResourcesBlogArticle | {}> = useState('featured-article', () => {})

  const iconsMap = {
    Education: 'uil:graduation-cap',
    Announcements: 'uil:microphone',
    Release: 'uil:rocket'
  }

  // Data fetching

  async function fetchList () {
    try {
      const data = await queryContent<ResourcesBlogArticle>('/blog').where({
        $not: {
          _path: {
            $in: ['/blog']
          }
        },
        _extension: 'md'
      }).sort({ date: -1 }).find()

      console.log({ data })

      articles.value = data.map(article => ({
        ...article,
        icon: iconsMap[article.category as keyof typeof iconsMap]
      })) as ResourcesBlogArticle[]
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
