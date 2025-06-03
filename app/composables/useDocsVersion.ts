const versions = [{
  label: '3.x',
  value: '3.x',
  prefix: '/docs',
  contentPrefix: '/docs/3.x'
}, {
  label: '4.x',
  suffix: '(alpha)',
  value: '4.x',
  prefix: '/docs/4.x',
  contentPrefix: '/docs/4.x'
}]

export const useDocsVersion = () => {
  const route = useRoute()

  const version = computed(() => {
    if (route.path.startsWith('/docs/4.x/')) {
      return versions.find(v => v.value === '4.x') || versions[0]
    } else if (route.path.startsWith('/docs/3.x/')) {
      return versions.find(v => v.value === '3.x') || versions[0]
    } else if (route.path.startsWith('/docs/')) {
      return versions.find(v => v.value === '3.x') || versions[0]
    }
    return versions[0]
  })

  const prefix = computed(() => version.value.prefix)
  const contentPrefix = computed(() => version.value.contentPrefix)

  const items = computed(() => versions.map(v => ({
    label: v.label,
    ...(v.value === version.value.value
      ? {
          active: true,
          color: 'primary' as const,
          checked: true
        }
      : {}),
    type: 'checkbox' as const,
    onSelect: () => {
      const currentPath = route.path
      const targetVersion = v

      let relativePath = ''

      if (currentPath.startsWith('/docs/3.x/')) {
        relativePath = currentPath.replace('/docs/3.x', '')
      } else if (currentPath.startsWith('/docs/4.x/')) {
        relativePath = currentPath.replace('/docs/4.x', '')
      } else if (currentPath.startsWith('/docs/')) {
        relativePath = currentPath.replace('/docs', '')
      }

      let newPath = ''

      if (targetVersion.value === '3.x') {
        newPath = `/docs${relativePath}`
      } else {
        newPath = `/docs/${targetVersion.value}${relativePath}`
      }

      navigateTo(newPath)
    }
  })))

  return {
    items,
    prefix,
    version,
    versions,
    contentPrefix
  }
}
