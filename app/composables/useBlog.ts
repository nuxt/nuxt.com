import type { BlogArticle } from '~/types'
import { clientContent } from '~/composables/client-content'
import { toSitePage } from '~/utils/content'

export const useBlog = () => {
  const { data: articles, refresh } = useAsyncData<BlogArticle[]>('blog', async () => {
    const items = await clientContent.query('local')
      .where('path', 'LIKE', '/blog/%')
      .where('meta.extension', '=', '.md')
      .order('data.date', 'DESC')
      .all()
    return items
      .map(item => toSitePage(item))
      .filter((article): article is BlogArticle => !!article && article.path !== '/blog' && !article.draft)
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
