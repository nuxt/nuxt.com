import type { BlogArticle } from '~/types'

export const useBlog = () => {
  const { data: articles, refresh } = useAsyncData<BlogArticle[]>('blog', async () => {
    return queryCollection('blog')
      .where('extension', '=', 'md')
      /* .select('title', 'date', 'image', 'description', 'path', 'authors', 'category') */
      .order('date', 'DESC')
      .all()
      .then(res => res.filter(article => article.path !== '/blog'))
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
