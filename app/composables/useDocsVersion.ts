import type { BadgeProps } from '@nuxt/ui'

interface Version {
  label: string
  shortTag: 'v4' | 'v3'
  branch: string
  tagColor: BadgeProps['color']
  path: string
  collection: 'docsv3' | 'docsv4'
}

const versions: Version[] = [
  {
    label: 'Version 4',
    shortTag: 'v4',
    branch: 'main',
    tagColor: 'info',
    path: '/docs/4.x',
    collection: 'docsv4'
  },
  {
    label: 'Version 3',
    shortTag: 'v3',
    branch: '3.x',
    tagColor: 'primary',
    path: '/docs/3.x',
    collection: 'docsv3'
  }
]

const tagMap: Record<Version['shortTag'], string> = {
  v3: '3x',
  v4: '4x'
}

export const useDocsTags = () => {
  const { data: tags } = useAsyncData('versions', async () => {
    const { 'dist-tags': distTags } = await $fetch<{ 'dist-tags': Record<string, string> }>('https://registry.npmjs.org/nuxt')
    return Object.fromEntries(
      Object.entries(tagMap).map(([shortTag]: [keyof typeof tagMap, string]) => {
        return [shortTag, distTags[tagMap[shortTag]] ?? distTags.latest]
      })
    )
  }, { default: () => ({}) })

  return { tags }
}

export const useDocsVersion = () => {
  const route = useRoute()

  const version = computed(() => {
    if (route.path.startsWith('/docs/3.x')) {
      return versions.find(v => v.path === '/docs/3.x')
    }

    return versions[0]
  })

  const items = computed(() => versions.map(v => ({
    ...v,
    ...(v.branch === version.value.branch
      ? {
          checked: true,
          color: v.tagColor,
          type: 'checkbox' as const
        }
      : {
          to: route.path.replace(version.value.path, v.path)
        })
  })))

  return {
    items,
    version,
    versions
  }
}
