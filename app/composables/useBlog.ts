import type { BlogArticle } from '#shared/types'

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
