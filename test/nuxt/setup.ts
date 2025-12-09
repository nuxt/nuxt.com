import { registerEndpoint } from '@nuxt/test-utils/runtime'

registerEndpoint('/api/stats', () => {
  return { id: 71995937, name: 'nuxt', repo: 'nuxt/nuxt', description: 'The Progressive Web Framework.', createdAt: '2016-10-26T11:18:47Z', updatedAt: '2025-12-05T12:35:49Z', pushedAt: '2025-12-04T22:26:25Z', stars: 59003, watchers: 59003, forks: 5451, defaultBranch: 'main', version: '4.2.1', monthlyDownloads: 4350710 }
})
