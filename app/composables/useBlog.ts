import type { BlogArticle } from '~/types'

export const useBlog = () => {
  const { data: articles, refresh } = useAsyncData<BlogArticle[]>('blog', async () => {
    const list = await clientContent.list('blog-list')
    return list
      .filter(article => article.meta.extension === '.md')
      .map(article => ({ ...article.data, path: article.path }) as BlogArticle)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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
