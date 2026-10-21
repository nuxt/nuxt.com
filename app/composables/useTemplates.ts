import type { Template, TemplateHealth } from '#shared/types'

/** Every template and official starter, from `content/templates/**`, with what nuxt.com checked about each one. */
export async function useTemplates() {
  const [{ data }, { data: health }] = await Promise.all([
    useAsyncData('templates', () => listByDir<Template>('/templates'), { default: () => [] }),
    useFetch<Record<string, TemplateHealth>>('/api/templates/health', { key: 'templates-health', default: () => ({}) })
  ])

  const starters = computed(() => data.value
    .filter(isStarter)
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99)))

  const templates = computed(() => data.value
    .filter(template => !isStarter(template) && !health.value[template.slug]?.archived)
    .sort((a, b) => Number(isOutdated(health.value[a.slug])) - Number(isOutdated(health.value[b.slug]))
      || Number(health.value[a.slug]?.check?.status === 'failed') - Number(health.value[b.slug]?.check?.status === 'failed')
      || Number(!!a.purchase) - Number(!!b.purchase)
      || Number(!!b.featured) - Number(!!a.featured)
      || Number(!!b.official) - Number(!!a.official)))

  return { all: data, starters, templates, health }
}
