import type { BlogArticle } from '~/types'

/**
 * Paths of the release announcements, e.g. `/blog/v4-5`. Kept to paths only so version badges
 * can check whether a release has a post to link to without pulling the whole blog.
 */
export const useReleaseArticlePaths = () => {
  const { data: paths } = useAsyncData('release-article-paths', () => {
    return queryCollection('blog')
      .where('category', '=', 'Release')
      .select('path')
      .all()
      .then(articles => articles.map(article => article.path))
  }, { default: () => [] })

  return { paths }
}

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
