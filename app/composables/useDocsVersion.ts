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

  const version = computed(() => versions.find(v => route.params.branch && v.value === route.params.branch) || versions[0])
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
    type: 'checkbox' as const
  })))

  return {
    items,
    prefix,
    version,
    versions,
    contentPrefix
  }
}
