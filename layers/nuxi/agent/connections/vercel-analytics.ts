import { defineOpenAPIConnection } from 'eve/connections'
import { adminOnlyVercelAuth, VERCEL_PROJECT_ID, VERCEL_TEAM_ID } from '../lib/vercel-connect.js'

const BY_DIMENSIONS = [
  'hour',
  'day',
  'week',
  'month',
  'year',
  'country',
  'deviceType',
  'environment',
  'requestPath',
  'referrerHostname',
  'osName',
  'browserName',
  'route',
  'utmSource',
  'utmMedium',
  'utmCampaign',
  'utmContent',
  'utmTerm',
  'flags'
] as const

const projectIdParam = {
  name: 'projectId',
  in: 'query' as const,
  required: true,
  schema: { type: 'string' },
  description: 'The Vercel project identifier or name.'
}

const teamIdParam = {
  name: 'teamId',
  in: 'query' as const,
  required: false,
  schema: { type: 'string' },
  description: 'The Vercel team identifier to perform the request on behalf of.'
}

const filterParam = {
  name: 'filter',
  in: 'query' as const,
  required: false,
  schema: { type: 'string' },
  description: 'OData-compliant filter, e.g. "requestPath eq \'/docs\'". Supported dimensions: country, deviceType, environment, requestPath, referrerHostname, osName, browserName, route, utmSource, utmMedium, utmCampaign, utmContent, utmTerm. Defaults to production environment only.'
}

const sinceUntilParams = (required: boolean) => [
  {
    name: 'since',
    in: 'query' as const,
    required,
    schema: { type: 'string' },
    description: 'Start of the range (inclusive): ISO date string or millisecond timestamp.'
  },
  {
    name: 'until',
    in: 'query' as const,
    required,
    schema: { type: 'string' },
    description: 'End of the range (inclusive): ISO date string or millisecond timestamp.'
  }
]

const okResponse = { 200: { description: 'OK' } }

function countOperation(operationId: string, summary: string) {
  return {
    get: {
      operationId,
      summary,
      security: [{ bearerToken: [] }],
      parameters: [projectIdParam, teamIdParam, ...sinceUntilParams(false), filterParam],
      responses: okResponse
    }
  }
}

function aggregateOperation(operationId: string, summary: string) {
  return {
    get: {
      operationId,
      summary,
      security: [{ bearerToken: [] }],
      parameters: [
        projectIdParam,
        teamIdParam,
        {
          name: 'by',
          in: 'query' as const,
          required: true,
          schema: {
            type: 'array',
            minItems: 1,
            maxItems: 2,
            items: { type: 'string', enum: BY_DIMENSIONS }
          },
          description: 'Up to two dimensions to break results down by. At most one time granularity (hour/day/week/month/year) is allowed.'
        },
        ...sinceUntilParams(true),
        {
          name: 'limit',
          in: 'query' as const,
          required: false,
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          description: 'Number of distinct results to return, defaults to 10. Remaining results are grouped into "Others".'
        },
        filterParam
      ],
      responses: okResponse
    }
  }
}

const analyticsSpec = {
  openapi: '3.0.3',
  info: { title: 'Vercel Web Analytics', version: '1.0.0' },
  servers: [{ url: 'https://api.vercel.com' }],
  components: {
    securitySchemes: {
      bearerToken: { type: 'http', scheme: 'bearer' }
    }
  },
  paths: {
    '/v1/query/web-analytics/visits/count': countOperation('countPageviews', 'Counts page views'),
    '/v1/query/web-analytics/events/count': countOperation('countEvents', 'Counts custom events'),
    '/v1/query/web-analytics/visits/aggregate': aggregateOperation('aggregatePageviews', 'Aggregates page views'),
    '/v1/query/web-analytics/events/aggregate': aggregateOperation('aggregateEvents', 'Aggregates custom events')
  }
}

export const VERCEL_ANALYTICS_INSTRUCTIONS = `**Vercel Analytics connection (\`connection__vercel_analytics__*\`, admin/Slack/schedule only) — read-only, production data only:**
- Discover exact schemas via \`connection__search\`, then call \`connection__vercel_analytics__<operationId>\`.
- Pass \`projectId=${VERCEL_PROJECT_ID}\`, \`teamId=${VERCEL_TEAM_ID}\` explicitly on every call.
- \`countPageviews\` / \`countEvents\` — a single total, e.g. "how many visitors this week". \`aggregatePageviews\` / \`aggregateEvents\` — breakdown by time or a dimension (country, route, referrer, device, ...) via \`by\`.
- \`since\`/\`until\` accept ISO dates or ms timestamps; required for \`aggregate*\`, optional for \`count*\` (defaults to all-time).
- \`filter\` uses OData syntax, e.g. \`requestPath eq '/blog/my-post'\`.
- Counts default to production traffic only.`

export default defineOpenAPIConnection({
  spec: analyticsSpec,
  description: 'Vercel Web Analytics for nuxt.com: page views, visitors, and custom events. Admin/Slack/schedule sessions only.',
  auth: adminOnlyVercelAuth('Vercel Analytics', { connector: 'vercel/mcp', principalType: 'app', autoProvision: false })
})
