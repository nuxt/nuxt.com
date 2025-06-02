interface DocsVersion {
  label: string
  value: '3.x' | '4.x'
  pathPrefix: string
  branch: string
}

const versions: DocsVersion[] = [
  {
    label: 'v4.x',
    value: '4.x',
    pathPrefix: '/docs/v4',
    branch: 'main'
  },
  {
    label: 'v3.x',
    value: '3.x',
    pathPrefix: '/docs/v3',
    branch: '3.x'
  }
]

export const useDocsVersion = () => {
  const route = useRoute()
  const router = useRouter()

  const currentVersion = computed(() => {
    if (route.params.branch) {
      if (route.params.branch === 'v4' || route.params.branch === 'main') {
        return '4.x'
      }
      if (route.params.branch === 'v3' || route.params.branch === '3.x') {
        return '3.x'
      }
    }

    if (route.path.startsWith('/docs/v4/')) {
      return '4.x'
    }
    if (route.path.startsWith('/docs/v3/')) {
      return '3.x'
    }

    return '3.x'
  })

  const selectedVersion = computed(() => {
    return versions.find(v => v.value === currentVersion.value) || versions[1]
  })

  const versionItems = computed(() => {
    return versions.map(version => ({
      label: version.label,
      active: version.value === currentVersion.value,
      color: version.value === currentVersion.value ? 'primary' : undefined,
      checked: version.value === currentVersion.value,
      type: 'checkbox' as const
    }))
  })

  return {
    currentVersion,
    selectedVersion,
    versions,
    versionItems
  }
}
