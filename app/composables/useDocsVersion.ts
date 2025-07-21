import type { BadgeProps } from '@nuxt/ui'

interface Version {
  label: string
  tag: string
  shortTag: string
  branch: string
  tagColor: BadgeProps['color']
  path: string
  collection: 'docsv3' | 'docsv4'
}

// TODO: get versions from npm registry
const versions: Version[] = [
  {
    label: 'Version 4',
    tag: '4.0.1',
    shortTag: 'v4',
    branch: 'main',
    tagColor: 'info',
    path: '/docs/4.x',
    collection: 'docsv4'
  },
  {
    label: 'Version 3',
    // TODO: update this on release
    tag: '3.17.7',
    shortTag: 'v3',
    branch: '3.x',
    tagColor: 'primary',
    path: '/docs/3.x',
    collection: 'docsv3'
  }
]

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
