import type { BadgeProps } from '@nuxt/ui'
import { CURRENT_DOCS_VERSION, docsMajor, docsPathPrefix, DOC_VERSIONS, type DocVersion, type Major } from '#shared/utils/docs'
import { docsInstanceKey, type ContentInstanceKey } from '#shared/utils/content'

interface DocsMeta {
  label: string
  /** `'2'` only for the legacy Nuxt 2 entry, which has no `DocVersion`. */
  major: Major | '2'
  path: string
  tagColor: BadgeProps['color']
  /** `unsupported` versions are end of life: no bug fixes, no security patches. */
  status?: 'prerelease' | 'stable' | 'unsupported'
  /** Date the version reached end of life, for `unsupported` versions. */
  endOfLife?: string
  /** Third-party extended support offering, for `unsupported` versions. */
  extendedSupport?: string
}

/** What can't be derived from the `DocVersion` itself — everything else (`label`, `major`, `path`) is computed below. */
const DOCS_META_OVERRIDES: Record<DocVersion, Pick<DocsMeta, 'tagColor' | 'status' | 'endOfLife' | 'extendedSupport'>> = {
  '5.x': { tagColor: 'warning', status: 'prerelease' },
  '4.x': { tagColor: 'primary', status: 'stable' },
  '3.x': {
    tagColor: 'neutral',
    status: 'unsupported',
    endOfLife: '31 July 2026',
    extendedSupport: 'https://www.herodevs.com/support/nuxt-nes?utm_source=nuxtjs&utm_medium=affiliate&utm_campaign=nuxt3eol&utm_content=link'
  }
}

/** One `DocsMeta` per `DocVersion`, keyed the same way — adding a version only means editing `DOC_VERSIONS` and this. */
const docsMetaByVersion: Record<DocVersion, DocsMeta> = Object.fromEntries(DOC_VERSIONS.map(v => [v, {
  label: `Version ${docsMajor(v)}`,
  major: docsMajor(v),
  path: docsPathPrefix(v),
  ...DOCS_META_OVERRIDES[v]
}])) as Record<DocVersion, DocsMeta>

/** Nuxt 2: no content instance, no `DocVersion` — an external link kept in the switcher for history's sake. */
const legacyMeta: DocsMeta = {
  label: 'Version 2',
  major: '2',
  path: 'https://v2.nuxt.com',
  tagColor: 'neutral',
  status: 'unsupported',
  endOfLife: '30 June 2024'
}

/** Newest first, legacy last — the order the switcher lists them in. */
const metaList: DocsMeta[] = [...[...DOC_VERSIONS].reverse().map(v => docsMetaByVersion[v]), legacyMeta]

export type Tags = Record<DocVersion, string>

export const useDocsTags = () => {
  const { data: tags } = useAsyncData('versions', async () => {
    const { 'dist-tags': distTags } = await $fetch<{ 'dist-tags': Record<string, string> }>('https://registry.npmjs.org/nuxt')
    return Object.fromEntries(DOC_VERSIONS.map((v) => {
      // TODO: remove nightly fallback when Nuxt 5 is released
      if (v === '5.x') return [v, distTags['5x'] ?? '5 (nightly)']
      return [v, distTags[`${docsMajor(v)}x`] ?? distTags.latest]
    })) as Tags
  }, { default: () => ({}) as Tags })

  return { tags }
}

export const useDocsVersion = () => {
  const route = useRoute()
  const { track } = useAnalytics()

  /** The active `DocVersion`, from the route */
  const version = computed<DocVersion>(() =>
    DOC_VERSIONS.find(v => route.path.startsWith(docsPathPrefix(v))) ?? CURRENT_DOCS_VERSION)

  const meta = computed(() => docsMetaByVersion[version.value])

  const items = computed(() => metaList.map(v => ({
    ...v,
    label: v.status === 'unsupported' ? `${v.label} (EOL)` : v.label,
    ...(v.path === meta.value.path
      ? {
          checked: true,
          color: v.tagColor,
          type: 'checkbox' as const
        }
      : {
          to: v.path === legacyMeta.path ? v.path : route.path.replace(meta.value.path, v.path),
          onSelect: () => track('Version Switched', { version: `v${v.major}` })
        })
  })))

  /** The content instance key holding the active version's docs. */
  const instanceKey = computed<ContentInstanceKey>(() => docsInstanceKey(version.value))

  return {
    items,
    meta,
    version,
    instanceKey
  }
}
