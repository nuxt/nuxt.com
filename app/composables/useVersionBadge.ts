import type { MaybeRefOrGetter } from 'vue'

export interface UseVersionBadgeOptions {
  /** How far behind the latest release the requirement may be. Defaults to the whole current major. */
  tolerance?: MaybeRefOrGetter<VersionTolerance>
}

/**
 * Decides whether a minimum Nuxt version is worth surfacing as a badge for the docs
 * version currently being read — a requirement older than `tolerance` is not news anymore.
 */
export const useVersionBadge = (version: MaybeRefOrGetter<string | undefined>, options: UseVersionBadgeOptions = {}) => {
  const { latest } = useDocsLatestVersion()

  const label = computed(() => {
    const value = toValue(version)?.trim()
    return value ? `v${value}` : undefined
  })

  const show = computed(() => satisfiesVersionTolerance(toValue(version), latest.value, toValue(options.tolerance) ?? { major: 0 }))

  return {
    label,
    show,
    latest
  }
}
