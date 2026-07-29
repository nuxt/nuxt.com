import type { MaybeRefOrGetter } from 'vue'

export interface UseVersionBadgeOptions {
  /** How far behind the latest release the requirement may be. Defaults to the whole current major. */
  tolerance?: MaybeRefOrGetter<VersionTolerance>
}

/**
 * Decides whether a minimum Nuxt version is worth surfacing as a badge for the docs
 * version currently being read — a requirement older than `tolerance` is not news anymore.
 *
 * `version` takes a version number or one of the {@link VERSION_KEYWORDS}, e.g. `unreleased`.
 */
export const useVersionBadge = (version: MaybeRefOrGetter<string | undefined>, options: UseVersionBadgeOptions = {}) => {
  const { version: docsVersion } = useDocsVersion()
  const { latest } = useDocsLatestVersion()

  const labels = computed(() => versionBadgeLabels(toValue(version), docsVersion.value?.shortTag))
  const label = computed(() => labels.value?.label)
  /** For tight spots like the sidebar — `soon` instead of `nightly v4` */
  const shortLabel = computed(() => labels.value?.shortLabel)
  const ariaLabel = computed(() => labels.value?.ariaLabel)

  const show = computed(() => satisfiesVersionTolerance(toValue(version), latest.value, toValue(options.tolerance) ?? { major: 0 }))

  return {
    label,
    shortLabel,
    ariaLabel,
    show,
    latest
  }
}
