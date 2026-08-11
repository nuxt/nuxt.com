import type { BlogArticle } from '~/types'
import { clientContent } from '~/composables/client-content'

export const useBlog = () => {
  const { data: articles, refresh } = useAsyncData<BlogArticle[]>('blog', async () => {
    const items = await clientContent.query('local')
      .where('path', 'LIKE', '/blog/%')
      .where('meta.extension', '=', '.md')
      .order('data.date', 'DESC')
      .all()
    return (items as BlogArticle[])
      .filter(article => article.path !== '/blog' && !article.data.draft)
  }, { default: () => [] })

  async function fetchList() {
    if (!articles.value?.length) {
      return refresh()
    }
  }

  return {
    articles,
    fetchList
  }
}
