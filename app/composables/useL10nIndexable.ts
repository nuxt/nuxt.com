import { isLocalisedPage, L10N_INDEXABLE_PATH, pageIndexable, type L10nIndexable } from '#shared/utils/l10n'

let indexable: Promise<L10nIndexable> | undefined

/** Every indexable localised page, fetched once per visit in the browser. */
function fetchIndexable(): Promise<L10nIndexable> {
  if (import.meta.server) return $fetch<L10nIndexable>(L10N_INDEXABLE_PATH).catch(() => ({}))
  return indexable ??= $fetch<L10nIndexable>(L10N_INDEXABLE_PATH).catch(() => {
    indexable = undefined
    return {}
  })
}

/**
 * The indexable translations of the docs page `path`, for its `hreflang` alternates and robots.
 * Does not block client-side navigation.
 */
export function useL10nIndexable(path: Ref<string>) {
  return useAsyncData(computed(() => `l10n-indexable:${path.value}`), () => isLocalisedPage(path.value) ? fetchIndexable() : Promise.resolve({}), {
    lazy: true,
    transform: all => pageIndexable(all, path.value),
    default: (): L10nIndexable => ({})
  })
}
