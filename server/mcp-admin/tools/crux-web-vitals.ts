import { z } from 'zod'

const METRICS = {
  lcp: 'largest_contentful_paint',
  inp: 'interaction_to_next_paint',
  cls: 'cumulative_layout_shift',
  fcp: 'first_contentful_paint',
  ttfb: 'experimental_time_to_first_byte'
} as const

type Bin = { start: number | string, end?: number | string }
type CruxDate = { year: number, month: number, day: number }
type CruxResponse = {
  record: {
    key: Record<string, string>
    metrics: Record<string, {
      histogram?: Array<Bin & { density: number }>
      percentiles?: { p75: number | string }
      histogramTimeseries?: Bin[]
      percentilesTimeseries?: { p75s: Array<number | string | null> }
    }>
    collectionPeriod?: { firstDate: CruxDate, lastDate: CruxDate }
    collectionPeriods?: Array<{ firstDate: CruxDate, lastDate: CruxDate }>
  }
}

const formatDate = ({ year, month, day }: CruxDate) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

/** Rates a p75 against the metric's good / poor thresholds, which CrUX returns as the bounds of its 3 histogram bins. */
function rate(p75: number | string | null | undefined, bins: Bin[]): 'good' | 'needs-improvement' | 'poor' | null {
  if (p75 === null || p75 === undefined) return null
  const value = Number(p75)
  if (value <= Number(bins[0]?.end)) return 'good'
  return value <= Number(bins[1]?.end) ? 'needs-improvement' : 'poor'
}

/** Passes when LCP, INP and CLS are all good; unknown when one of them has no data. */
function assess(ratings: Partial<Record<keyof typeof METRICS, string | null>>): 'passed' | 'failed' | 'unknown' {
  const core = [ratings.lcp, ratings.inp, ratings.cls]
  if (core.some(rating => rating && rating !== 'good')) return 'failed'
  return core.every(rating => rating === 'good') ? 'passed' : 'unknown'
}

const inputSchema = z.object({
  url: z.string().optional().describe('Page path (/docs/...) or full nuxt.com URL. Omit for the whole nuxt.com origin.'),
  formFactor: z.enum(['PHONE', 'DESKTOP', 'TABLET']).optional().describe('Device class. Omit to aggregate all devices.'),
  weeks: z.number().int().min(1).max(40).optional().describe('Return a weekly p75 trend over this many collection periods (each covering the previous 28 days) instead of the latest snapshot.')
})

export default defineMcpTool({
  name: 'crux-web-vitals',
  title: 'Crux Web Vitals',
  group: 'admin',
  description: `Field Core Web Vitals for nuxt.com from real Chrome users (Chrome UX Report): p75 of LCP, INP, CLS, FCP and TTFB, their good / needs-improvement / poor rating and distribution, and whether the Core Web Vitals assessment passes. These are the numbers Google Search uses for its page experience signals.

WHEN TO USE: Check whether a page (or the whole site) is slow for real users, compare phone vs desktop, or pass \`weeks\` to see a weekly trend and confirm a performance fix landed.

NOTES: Each value aggregates the previous 28 days, with a ~2 day lag; weekly history updates on Mondays. Low-traffic pages have no page-level data (\`found: false\`): query the origin instead (omit \`url\`). LCP, INP, FCP, TTFB are in milliseconds; CLS is unitless.`,
  inputSchema: inputSchema.meta({ examples: [
    { formFactor: 'PHONE' },
    { url: '/docs/4.x/getting-started/introduction' },
    { url: '/modules', formFactor: 'PHONE', weeks: 12 }
  ] satisfies z.input<typeof inputSchema>[] }),
  annotations: {
    readOnlyHint: true,
    openWorldHint: true
  },
  async handler({ url, formFactor, weeks }) {
    const target = url ? { url: url.startsWith('/') ? `https://nuxt.com${url}` : url } : { origin: 'https://nuxt.com' }
    const response = await cruxFetch<CruxResponse>(weeks ? 'queryHistoryRecord' : 'queryRecord', {
      ...target,
      formFactor,
      metrics: Object.values(METRICS),
      collectionPeriodCount: weeks
    })

    if (!response) {
      return {
        ...target,
        formFactor: formFactor ?? 'ALL',
        found: false,
        hint: url ? 'Not enough Chrome traffic for page-level data. Omit `url` to get the nuxt.com origin.' : 'No CrUX data for this origin and form factor.'
      }
    }

    const { record } = response
    const entries = Object.entries(METRICS).filter(([, name]) => record.metrics[name])

    if (record.collectionPeriods) {
      const periods = record.collectionPeriods.map((period, i) => {
        const values = Object.fromEntries(entries.map(([short, name]) => {
          const metric = record.metrics[name]!
          const p75 = metric.percentilesTimeseries?.p75s[i] ?? null
          return [short, { p75: p75 === null ? null : Number(p75), rating: rate(p75, metric.histogramTimeseries ?? []) }]
        }))
        const ratings = Object.fromEntries(Object.entries(values).map(([short, value]) => [short, value.rating]))
        return { firstDate: formatDate(period.firstDate), lastDate: formatDate(period.lastDate), assessment: assess(ratings), ...values }
      })
      return { ...record.key, formFactor: formFactor ?? 'ALL', found: true, periods }
    }

    const metrics = Object.fromEntries(entries.map(([short, name]) => {
      const { histogram = [], percentiles } = record.metrics[name]!
      const percent = (bin: number) => Math.round((histogram[bin]?.density ?? 0) * 1000) / 10
      return [short, {
        p75: percentiles ? Number(percentiles.p75) : null,
        rating: rate(percentiles?.p75, histogram),
        goodPercent: percent(0),
        needsImprovementPercent: percent(1),
        poorPercent: percent(2)
      }]
    }))

    return {
      ...record.key,
      formFactor: formFactor ?? 'ALL',
      found: true,
      collectionPeriod: record.collectionPeriod && { firstDate: formatDate(record.collectionPeriod.firstDate), lastDate: formatDate(record.collectionPeriod.lastDate) },
      assessment: assess(Object.fromEntries(Object.entries(metrics).map(([short, value]) => [short, value.rating]))),
      metrics
    }
  }
})
