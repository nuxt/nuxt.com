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

const versions: Version[] = [{
  label: 'Version 3',
  tag: 'latest',
  shortTag: 'v3',
  branch: '3.x',
  tagColor: 'primary',
  path: '/docs',
  collection: 'docsv3'
}, {
  label: 'Version 4',
  tag: 'alpha',
  shortTag: 'v4',
  branch: 'main',
  tagColor: 'warning',
  path: '/docs/4.x',
  collection: 'docsv4'
}]

export const useDocsVersion = () => {
  const route = useRoute()

  const version = computed(() => {
    if (route.path.startsWith('/docs/4.x')) {
      return versions.find(v => v.path === '/docs/4.x')
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
