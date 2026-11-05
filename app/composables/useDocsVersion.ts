import type { BadgeProps } from '@nuxt/ui'
import { CURRENT_DOCS_VERSION, docsMajor, docsPathPrefix, docsStatus, DOC_VERSIONS, getVersionByPath, type DocsStatus, type DocVersion, type Major } from '#shared/utils/docs'
import { docsInstanceKey, type ContentInstanceKey } from '#shared/utils/content'

interface DocsMeta {
  label: string
  major: Major
  path: string
  status: DocsStatus
  tagColor: BadgeProps['color']
  /** Set once the version is end of life: no bug fixes, no security patches. */
  endOfLife?: string
  /** Third-party extended support offering, for end-of-life versions. */
  extendedSupport?: string
  /** Where the end-of-life alert sends readers. */
  upgradePath?: string
}

const DOCS_META_OVERRIDES: Record<DocVersion, Pick<DocsMeta, 'tagColor' | 'endOfLife' | 'extendedSupport' | 'upgradePath'>> = {
  '5.x': { tagColor: 'warning' },
  '4.x': { tagColor: 'primary' },
  '3.x': {
    tagColor: 'neutral',
    endOfLife: '31 July 2026',
    extendedSupport: 'https://www.herodevs.com/support/nuxt-nes?utm_source=nuxtjs&utm_medium=affiliate&utm_campaign=nuxt3eol&utm_content=link',
    upgradePath: '/docs/4.x/getting-started/upgrade'
  },
  '2.x': {
    tagColor: 'neutral',
    endOfLife: '30 June 2024',
    extendedSupport: 'https://www.herodevs.com/support/nuxt-nes?utm_source=nuxt&utm_medium=nuxt-eol-article',
    upgradePath: '/docs/4.x/migration/overview'
  }
}

/** One `DocsMeta` per `DocVersion`, keyed the same way — adding a version only means editing `DOC_VERSIONS` and this. */
const docsMetaByVersion: Record<DocVersion, DocsMeta> = Object.fromEntries(DOC_VERSIONS.map(v => [v, {
  label: `Version ${docsMajor(v)}`,
  major: docsMajor(v),
  path: docsPathPrefix(v),
  status: docsStatus(v),
  ...DOCS_META_OVERRIDES[v]
}])) as Record<DocVersion, DocsMeta>

/** Newest first, the order the switcher lists them in. */
const metaList: DocsMeta[] = [...DOC_VERSIONS].reverse().map(v => docsMetaByVersion[v])

export type Tags = Record<DocVersion, string>

export const useDocsTags = () => {
  const { data: tags } = useAsyncData('versions', async () => {
    const { 'dist-tags': distTags } = await $fetch<{ 'dist-tags': Record<string, string> }>('https://registry.npmjs.org/nuxt')
    return Object.fromEntries(DOC_VERSIONS.map((v) => {
      // TODO: remove nightly fallback when Nuxt 5 is released
      if (v === '5.x') return [v, distTags['5x'] ?? '5 (nightly)']
      // npm's `Nx` tags only track non-latest majors, so the current version reads `latest`
      if (v === CURRENT_DOCS_VERSION) return [v, distTags.latest]
      return [v, distTags[`${docsMajor(v)}x`] ?? distTags.latest]
    })) as Tags
  }, { default: () => ({}) as Tags })

  return { tags }
}

export const useDocsVersion = () => {
  const route = useRoute()
  const { track } = useAnalytics()

  /** The active `DocVersion`, from the route */
  const version = computed<DocVersion>(() => getVersionByPath(route.path) ?? CURRENT_DOCS_VERSION)

  const meta = computed(() => docsMetaByVersion[version.value])

  const items = computed(() => metaList.map(v => ({
    ...v,
    label: v.endOfLife ? `${v.label} (EOL)` : v.label,
    ...(v.path === meta.value.path
      ? {
          checked: true,
          color: v.tagColor,
          type: 'checkbox' as const
        }
      : {
          to: v.status === 'archived' || meta.value.status === 'archived' ? v.path : route.path.replace(meta.value.path, v.path),
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
