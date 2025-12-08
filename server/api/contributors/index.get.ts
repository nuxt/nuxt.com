export default cachedEventHandler(async () => {
  return $fetch<NuxtersContributor[]>('https://nuxters.nuxt.com/contributors.json')
}, {
  name: 'contributors',
  swr: true,
  maxAge: 60 * 5 // 5 minutes
})

interface NuxtersContributor {
  username: string
  githubId: string
  issues: number
  merged_pull_requests: number
  helpful_issues: number
  comments: number
  helpful_comments: number
  reactions: number
  score: number
  rank: number
}
