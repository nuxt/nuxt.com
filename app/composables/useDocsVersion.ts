interface Version {
  label: string
  branch: string
  path: string
  collection: 'docsv3' | 'docsv4'
}

const versions: Version[] = [{
  label: '3.x',
  branch: '3.x',
  path: '/docs',
  collection: 'docsv3'
}, {
  label: '4.x (alpha)',
  branch: '4.x',
  path: '/docs/4.x',
  collection: 'docsv4'
}]

export const useDocsVersion = () => {
  const route = useRoute()

  const version = computed(() => {
    if (route.path.startsWith('/docs/4.x')) {
      return versions.find(v => v.branch === '4.x')
    }

    return versions[0]
  })

  const items = computed(() => versions.map(v => ({
    label: v.label,
    ...(v.branch === version.value.branch
      ? {
          active: true,
          color: 'primary' as const,
          checked: true,
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
