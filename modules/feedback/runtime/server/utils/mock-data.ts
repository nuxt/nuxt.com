import type { Feedback } from '../../shared/types/feedback'
import type { FEEDBACK_RATINGS } from '../../../types'

const SAMPLE_PAGES = [
  { path: '/docs/4.x/getting-started/introduction', title: 'Introduction', stem: 'docs/4.x/getting-started/01.introduction' },
  { path: '/docs/4.x/getting-started/installation', title: 'Installation', stem: 'docs/4.x/getting-started/02.installation' },
  { path: '/docs/4.x/getting-started/configuration', title: 'Configuration', stem: 'docs/4.x/getting-started/03.configuration' },
  { path: '/docs/4.x/getting-started/views', title: 'Views', stem: 'docs/4.x/getting-started/04.views' },
  { path: '/docs/4.x/getting-started/assets', title: 'Assets', stem: 'docs/4.x/getting-started/05.assets' },
  { path: '/docs/4.x/getting-started/styling', title: 'Styling', stem: 'docs/4.x/getting-started/06.styling' },
  { path: '/docs/4.x/getting-started/routing', title: 'Routing', stem: 'docs/4.x/getting-started/07.routing' },
  { path: '/docs/4.x/getting-started/seo-meta', title: 'SEO and Meta', stem: 'docs/4.x/getting-started/08.seo-meta' },
  { path: '/docs/4.x/getting-started/data-fetching', title: 'Data Fetching', stem: 'docs/4.x/getting-started/09.data-fetching' },
  { path: '/docs/4.x/getting-started/state-management', title: 'State Management', stem: 'docs/4.x/getting-started/10.state-management' },
  { path: '/docs/4.x/getting-started/error-handling', title: 'Error Handling', stem: 'docs/4.x/getting-started/11.error-handling' },
  { path: '/docs/4.x/getting-started/server', title: 'Server', stem: 'docs/4.x/getting-started/12.server' },
  { path: '/docs/4.x/getting-started/testing', title: 'Testing', stem: 'docs/4.x/getting-started/13.testing' },
  { path: '/docs/4.x/getting-started/deployment', title: 'Deployment', stem: 'docs/4.x/getting-started/14.deployment' },
  { path: '/docs/4.x/getting-started/upgrade', title: 'Upgrade Guide', stem: 'docs/4.x/getting-started/15.upgrade' },
  { path: '/docs/4.x/guide/concepts/auto-imports', title: 'Auto Imports', stem: 'docs/4.x/guide/concepts/01.auto-imports' },
  { path: '/docs/4.x/guide/concepts/rendering', title: 'Rendering', stem: 'docs/4.x/guide/concepts/02.rendering' },
  { path: '/docs/4.x/guide/concepts/server-engine', title: 'Server Engine', stem: 'docs/4.x/guide/concepts/03.server-engine' },
  { path: '/docs/4.x/guide/concepts/typescript', title: 'TypeScript', stem: 'docs/4.x/guide/concepts/04.typescript' },
  { path: '/docs/4.x/guide/concepts/esm', title: 'ES Modules', stem: 'docs/4.x/guide/concepts/05.esm' },
  { path: '/docs/3.x/getting-started/introduction', title: 'Introduction', stem: 'docs/3.x/getting-started/01.introduction' },
  { path: '/docs/3.x/getting-started/installation', title: 'Installation', stem: 'docs/3.x/getting-started/02.installation' },
  { path: '/docs/3.x/guide/concepts/auto-imports', title: 'Auto Imports', stem: 'docs/3.x/guide/concepts/01.auto-imports' },
  { path: '/docs/3.x/guide/concepts/rendering', title: 'Rendering', stem: 'docs/3.x/guide/concepts/02.rendering' }
] as const

const FEEDBACK_COMMENTS: Record<typeof FEEDBACK_RATINGS[number], string[]> = {
  'very-helpful': [
    'Clear and concise explanation, exactly what I needed!',
    'Great documentation, helped me understand the concept quickly.',
    'Excellent examples, made it easy to follow along.',
    'This page saved me hours of debugging!',
    'Perfect explanation with practical examples.',
    'Very well structured, easy to navigate.',
    'The code snippets are very helpful.',
    'Best documentation I\'ve seen for this topic.',
    '',
    '',
    ''
  ],
  'helpful': [
    'Good overview, but could use more examples.',
    'Helpful content, answered my question.',
    'Solid documentation, got what I needed.',
    'Clear explanation, thanks!',
    'Useful information for getting started.',
    '',
    '',
    ''
  ],
  'not-helpful': [
    'Missing important details about edge cases.',
    'Could use more real-world examples.',
    'The explanation is too brief.',
    'Needs more context for beginners.',
    'Some links are outdated.',
    ''
  ],
  'confusing': [
    'The structure is hard to follow.',
    'Too many concepts introduced at once.',
    'Examples don\'t match the explanation.',
    'Missing prerequisites information.',
    'The terminology is not well explained.',
    ''
  ]
}

const COUNTRIES = [
  'US', 'FR', 'DE', 'GB', 'CA', 'NL', 'JP', 'AU', 'BR', 'IN',
  'ES', 'IT', 'PL', 'SE', 'CH', 'BE', 'AT', 'DK', 'NO', 'FI',
  'PT', 'CZ', 'RU', 'UA', 'CN', 'KR', 'SG', 'NZ', 'MX', 'AR',
  'unknown'
]

function randomDateInRange(daysAgo: number): Date {
  const now = Date.now()
  const past = now - (daysAgo * 24 * 60 * 60 * 1000)
  return new Date(past + Math.random() * (now - past))
}

function randomFingerprint(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
}

export function generateMockFeedback(count: number = 150): Feedback[] {
  const feedback: Feedback[] = []

  const ratingWeights = {
    'very-helpful': 0.35,
    'helpful': 0.40,
    'not-helpful': 0.15,
    'confusing': 0.10
  }

  function getWeightedRating(): typeof FEEDBACK_RATINGS[number] {
    const random = Math.random()
    let cumulative = 0
    for (const [rating, weight] of Object.entries(ratingWeights)) {
      cumulative += weight
      if (random < cumulative) {
        return rating as typeof FEEDBACK_RATINGS[number]
      }
    }
    return 'helpful'
  }

  for (let i = 0; i < count; i++) {
    const page = SAMPLE_PAGES[Math.floor(Math.random() * SAMPLE_PAGES.length)]
    const rating = getWeightedRating()
    const comments = FEEDBACK_COMMENTS[rating]
    const feedbackText = comments[Math.floor(Math.random() * comments.length)]
    const createdAt = randomDateInRange(90)
    const updatedAt = new Date(createdAt.getTime() + Math.random() * 1000 * 60 * 5)

    feedback.push({
      id: i + 1,
      rating,
      feedback: feedbackText || null,
      path: page.path,
      title: page.title,
      stem: page.stem,
      country: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
      fingerprint: randomFingerprint(),
      createdAt,
      updatedAt
    })
  }

  return feedback.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export const getMockFeedback = defineCachedFunction(() => generateMockFeedback(150), {
  maxAge: 60 * 60 * 24,
  name: 'getMockFeedback',
  getKey: () => 'default'
})

export async function deleteMockFeedback(id: number): Promise<boolean> {
  const data = await getMockFeedback()
  const index = data.findIndex(f => f.id === id)
  if (index === -1) return false

  data.splice(index, 1)
  return true
}
