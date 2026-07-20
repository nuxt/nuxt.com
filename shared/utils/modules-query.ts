import { z } from 'zod'

export const modulesVersionValues = ['2', '2-bridge', '3', '4', 'all'] as const

export const modulesQuerySchema = z.object({
  version: z.enum(modulesVersionValues).default('3'),
  category: z.string().optional()
})

export type ModulesQuery = z.infer<typeof modulesQuerySchema>

/**
 * Normalize h3 query values before Zod parse.
 * Numeric-looking params (e.g. version=4) may arrive as numbers.
 */
export function normalizeModulesQuery(raw: Record<string, unknown> | undefined): ModulesQuery {
  const versionRaw = raw?.version
  const categoryRaw = raw?.category

  return modulesQuerySchema.parse({
    version: versionRaw == null || versionRaw === ''
      ? undefined
      : String(Array.isArray(versionRaw) ? versionRaw[0] : versionRaw),
    category: typeof categoryRaw === 'string'
      ? categoryRaw
      : Array.isArray(categoryRaw) && typeof categoryRaw[0] === 'string'
        ? categoryRaw[0]
        : undefined
  })
}

export function modulesCacheKey(raw: Record<string, unknown> | undefined): string {
  const versionRaw = raw?.version
  const categoryRaw = raw?.category
  const version = versionRaw == null || versionRaw === ''
    ? '3'
    : String(Array.isArray(versionRaw) ? versionRaw[0] : versionRaw)
  const category = typeof categoryRaw === 'string'
    ? categoryRaw
    : Array.isArray(categoryRaw) && typeof categoryRaw[0] === 'string'
      ? categoryRaw[0]
      : 'all'
  return `${version}-${category || 'all'}`
}
