const versions: { label: string, branch: string, collection: 'docsv3' | 'docsv4', path: string }[] = [{
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

  const version = computed(() => versions.find(v => route.path.startsWith(v.path)) || versions[0])

  const items = computed(() => versions.map(v => ({
    label: v.label,
    ...(v.branch === version.value.branch
      ? {
          active: true,
          color: 'primary' as const,
          checked: true
        }
      : {}),
    type: 'checkbox' as const
    // onSelect: () => {
    //   const currentPath = route.path
    //   const targetVersion = v

    //   let relativePath = ''

    //   if (currentPath.startsWith('/docs/3.x/')) {
    //     relativePath = currentPath.replace('/docs/3.x', '')
    //   } else if (currentPath.startsWith('/docs/4.x/')) {
    //     relativePath = currentPath.replace('/docs/4.x', '')
    //   } else if (currentPath.startsWith('/docs/')) {
    //     relativePath = currentPath.replace('/docs', '')
    //   }

    //   let newPath = ''

    //   if (targetVersion.value === '3.x') {
    //     newPath = `/docs${relativePath}`
    //   } else {
    //     newPath = `/docs/${targetVersion.value}${relativePath}`
    //   }

    //   navigateTo(newPath)
    // }
  })))

  return {
    items,
    // prefix,
    version,
    versions
    // contentPrefix
  }
}
