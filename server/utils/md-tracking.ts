import type { H3Event } from 'h3'
import type { DetectionMethod } from '@vercel/agent-readability'

interface TrackMdRequestParams {
  path: string
  source: 'docs' | 'blog' | 'deploy' | 'modules' | 'changelog' | 'homepage' | 'agent-404'
  userAgent: string | null
  referer: string | null
  acceptHeader: string | null
  requestType?: 'md-url' | 'header-negotiated' | 'agent-rewrite'
  detectionMethod?: DetectionMethod | null
}

const config = useRuntimeConfig()

export function trackMdRequest(event: H3Event, params: TrackMdRequestParams): void {
  const url = config.mdTracking?.url
  const apiKey = config.mdTracking?.apiKey

  if (!url || !apiKey) return

  const promise = fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(params)
  }).catch((error) => {
    console.error('MD tracking error:', error)
  })

  event.waitUntil(promise)
}

export function extractTrackingContext(event: H3Event) {
  return {
    userAgent: getRequestHeader(event, 'user-agent') || null,
    referer: getRequestHeader(event, 'referer') || null,
    acceptHeader: getRequestHeader(event, 'accept') || null
  }
}

export function resolveSource(path: string): TrackMdRequestParams['source'] {
  if (path.startsWith('/docs/')) return 'docs'
  if (path.startsWith('/blog/')) return 'blog'
  if (path.startsWith('/deploy/')) return 'deploy'
  if (path.startsWith('/modules')) return 'modules'
  if (path.startsWith('/changelog')) return 'changelog'
  return 'docs'
}
