<script lang="ts" setup>
import type { TemplateCategory, TemplateSort, TemplateStatusFilter } from '#shared/types'

definePageMeta({
  heroBackground: 'opacity-80 -z-10'
})

const { data: page } = await useAsyncData('templates-landing', () => useContent('site').get('/templates'))
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const pageData = computed(() => page.value!.data)
const { starters, templates, health } = await useTemplates()

const route = useRoute()
const router = useRouter()

const category = computed({
  get: () => TEMPLATE_CATEGORIES.find(item => item.value === route.query.category)?.value,
  set: (value?: TemplateCategory) => router.replace({ query: { ...route.query, category: value } })
})
const queryText = () => typeof route.query.q === 'string' ? route.query.q : ''
const search = ref(queryText())
watch(() => route.query.q, () => search.value = queryText())
watchDebounced(search, (value) => {
  if (value !== queryText()) router.replace({ query: { ...route.query, q: value || undefined } })
}, { debounce: 250 })

const status = computed({
  get: () => TEMPLATE_STATUS_FILTERS.find(item => item.value === route.query.status)?.value ?? 'all',
  set: (value: TemplateStatusFilter | 'all') => router.replace({ query: { ...route.query, status: value === 'all' ? undefined : value } })
})
const sort = computed({
  get: () => TEMPLATE_SORTS.find(item => item.value === route.query.sort)?.value ?? 'recommended',
  set: (value: TemplateSort) => router.replace({ query: { ...route.query, sort: value === 'recommended' ? undefined : value } })
})
const statusItems = [{ value: 'all', label: 'Any status', icon: 'i-lucide-list' }, ...TEMPLATE_STATUS_FILTERS]

const categories = computed(() => TEMPLATE_CATEGORIES.filter(item => templates.value.some(template => template.category === item.value)))

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  const list = templates.value.filter((template) => {
    const templateHealth = health.value[template.slug]
    if (category.value && template.category !== category.value) return false
    if (status.value === 'working' && !isWorking(templateHealth)) return false
    if (status.value === 'live' && !(isWorking(templateHealth) && templateHealth?.check?.live)) return false
    if (!query) return true
    const modules = templateModules(template, templateHealth).map(module => moduleLabel(module.npm))
    return [template.name, template.description, ...modules].some(value => value?.toLowerCase().includes(query))
  })
  if (sort.value === 'stars') return list.sort((a, b) => (health.value[b.slug]?.stars ?? -1) - (health.value[a.slug]?.stars ?? -1))
  if (sort.value === 'updated') return list.sort((a, b) => (health.value[b.slug]?.updatedAt ?? '').localeCompare(health.value[a.slug]?.updatedAt ?? ''))
  if (sort.value === 'name') return list.sort((a, b) => a.name.localeCompare(b.name))
  return list
})

const submitUrl = computed(() => {
  const value = [
    `name: 'My Template'`,
    `slug: 'my-template'`,
    `description: 'One sentence about what it is for.'`,
    `repo: 'owner/repo'`,
    `demo: 'https://my-template.vercel.app'`,
    `category: 'saas'`,
    `modules:`,
    `  - '@nuxt/ui'`
  ].join('\n')
  return `https://github.com/nuxt/nuxt.com/new/main/content/templates?filename=my-template.yml&value=${encodeURIComponent(value)}`
})

const title = pageData.value.head?.title || pageData.value.title
const description = pageData.value.description

useSeoMeta({
  titleTemplate: '%s',
  title,
  description,
  ogDescription: description,
  ogTitle: title
})
useCanonical()
defineOgImage('Docs.takumi', {
  title,
  description
})
</script>

<template>
  <UPage v-if="pageData">
    <UPageHero
      :description="pageData.description"
      :ui="{
        container: '!pb-12',
        wrapper: 'text-left',
        title: 'text-left',
        description: 'text-left max-w-2xl'
      }"
    >
      <template #title>
        {{ pageData.hero.title }}<br><span class="text-primary">{{ pageData.hero.highlight }}</span>
      </template>

      <TemplatesQuickStart :starters="starters" />
    </UPageHero>

    <UPageBody class="space-y-16">
      <UContainer>
        <h2 class="mb-4 flex items-baseline gap-2 text-lg font-medium text-highlighted">
          {{ pageData.gallery.title }}
          <span class="font-mono text-sm font-normal text-dimmed tabular-nums">{{ filtered.length }}</span>
        </h2>
        <div class="mb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div class="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-1 overflow-x-auto [scrollbar-width:none]">
            <UButton
              v-for="item in [undefined, ...categories]"
              :key="item?.value ?? 'all'"
              :label="item?.label ?? 'All'"
              :aria-pressed="category === item?.value"
              :variant="category === item?.value ? 'soft' : 'ghost'"
              color="neutral"
              :class="category === item?.value ? 'text-highlighted' : 'text-muted'"
              class="shrink-0 rounded-full"
              size="sm"
              @click="category = item?.value"
            />
          </div>
          <div class="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
            <USelect
              v-model="status"
              :items="statusItems"
              :icon="statusItems.find(item => item.value === status)?.icon"
              size="sm"
              class="w-[calc(50%-0.25rem)] sm:w-36"
              aria-label="Filter by status"
              :ui="{ base: 'ring-default' }"
            />
            <USelect
              v-model="sort"
              :items="TEMPLATE_SORTS"
              icon="i-lucide-arrow-down-wide-narrow"
              size="sm"
              class="w-[calc(50%-0.25rem)] sm:w-44"
              aria-label="Sort templates"
              :ui="{ base: 'ring-default' }"
            />
            <UInput
              v-model="search"
              :placeholder="pageData.gallery.searchPlaceholder"
              icon="i-lucide-search"
              size="sm"
              class="w-full sm:w-56"
              aria-label="Search templates"
              :ui="{ base: 'ring-default' }"
            />
          </div>
        </div>

        <UPageGrid v-if="filtered.length" class="lg:grid-cols-3 xl:grid-cols-4">
          <TemplatesCard
            v-for="(template, index) in filtered"
            :key="template.slug"
            :template="template"
            :health="health[template.slug]"
            :index="index"
          />
        </UPageGrid>
        <div v-else class="py-16 flex flex-col items-center gap-3 text-center">
          <p class="text-muted">
            {{ pageData.gallery.empty }}
          </p>
          <UButton
            label="Clear Filters"
            color="neutral"
            variant="subtle"
            size="sm"
            class="ring-default"
            @click="search = ''; router.replace({ query: {} })"
          />
        </div>
        <div class="mt-8 flex justify-center">
          <TemplatesPoweredBy />
        </div>
      </UContainer>

      <UContainer>
        <UPageCTA
          :title="pageData.submit.title"
          :description="pageData.submit.description"
          variant="subtle"
          orientation="horizontal"
          :links="[
            { label: 'Submit Template', to: submitUrl, target: '_blank', icon: 'i-simple-icons-github', color: 'neutral' },
            { label: 'Read the Requirements', to: 'https://github.com/nuxt/nuxt.com/tree/main/content/templates', target: '_blank', color: 'neutral', variant: 'ghost', trailingIcon: 'i-lucide-arrow-up-right' }
          ]"
          :ui="{ title: 'text-xl sm:text-2xl', description: 'text-base' }"
        />
      </UContainer>
    </UPageBody>
  </UPage>
</template>
