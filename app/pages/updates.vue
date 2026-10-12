<script setup lang="ts">
import type { DropdownMenuItem, TabsItem } from '@nuxt/ui'
import type { BlogPost } from '~/composables/useBlog'

definePageMeta({
  heroBackground: false
})

const title = 'Updates'
const description = 'What\'s shipping across Nuxt and its official modules, as it happens.'

useSeoMeta({
  titleTemplate: '%s · Nuxt',
  title,
  description,
  ogTitle: `${title} · Nuxt`,
  ogDescription: description
})
useCanonical('/raw/updates.md')
useHead({
  link: [
    { rel: 'alternate', type: 'application/atom+xml', title: 'Nuxt Blog RSS', href: 'https://nuxt.com/blog/rss.xml' },
    { rel: 'alternate', type: 'application/atom+xml', title: 'Nuxt Changelog RSS', href: 'https://nuxt.com/changelog/rss.xml' }
  ]
})
defineOgImage('Docs.takumi', {
  headline: 'Updates',
  title: `Nuxt ${title}`,
  description
})

const route = useRoute()
const router = useRouter()

const category = computed({
  get: () => BLOG_CATEGORIES.find(item => item.slug === route.query.category)?.slug ?? 'all',
  set: (value: string) => router.replace({ query: { ...route.query, category: value === 'all' ? undefined : value } })
})

const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
const query = computed(() => search.value.trim())
watchDebounced(query, value => router.replace({ query: { ...route.query, q: value || undefined } }), { debounce: 250 })

const searchInput = useTemplateRef('searchInput')
defineShortcuts({
  '/': () => searchInput.value?.inputRef?.focus()
})

const { posts, timeline, ready } = useUpdates()
await ready

const tabs: TabsItem[] = [
  { label: 'All', value: 'all' },
  ...BLOG_CATEGORIES.map(({ slug, label }) => ({ label, value: slug }))
]

const feeds: DropdownMenuItem[] = [
  { label: 'Blog RSS', icon: 'i-lucide-rss', to: '/blog/rss.xml', external: true, target: '_blank' },
  { label: 'Changelog RSS', icon: 'i-lucide-rss', to: '/changelog/rss.xml', external: true, target: '_blank' }
]

const selectedCategory = computed(() => BLOG_CATEGORIES.find(item => item.slug === category.value)?.value)
const inCategory = (post: BlogPost) => !selectedCategory.value || post.category === selectedCategory.value

const articles = computed(() => {
  const regexp = searchTextRegExp(query.value)
  return posts.value.filter(post => inCategory(post) && (regexp.test(post.title) || regexp.test(post.description)))
})

const PAGE_SIZE = 12
const limit = ref(PAGE_SIZE)
watch([category, query], () => {
  limit.value = PAGE_SIZE
})
</script>

<template>
  <UContainer>
    <UPageHeader
      :title="title"
      :description="description"
      :ui="{
        root: 'border-none pt-12 pb-10 sm:pt-16',
        container: 'sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-8',
        wrapper: 'sm:contents',
        links: 'sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:self-end',
        description: 'max-w-xl'
      }"
    >
      <template #links>
        <div class="flex w-full flex-col gap-1.5 sm:w-72 sm:items-end">
          <p class="text-xs text-muted">
            Never miss a release. We'll keep you posted.
          </p>
          <NewsletterForm label="" description="" size="sm" class="w-full" />
        </div>
      </template>
    </UPageHeader>

    <UPageBody class="mt-0 flex flex-col gap-20 space-y-0">
      <UpdatesTimeline v-if="timeline.length" :items="timeline" />

      <section aria-labelledby="articles-heading" class="flex flex-col gap-10">
        <div class="flex flex-col gap-4">
          <h2 id="articles-heading" class="text-2xl text-highlighted">
            Articles
          </h2>
          <!-- The default underline sits 1px below the list, which would make the scrollable list scroll vertically too. -->
          <UTabs
            v-model="category"
            :items="tabs"
            :content="false"
            variant="link"
            color="neutral"
            :ui="{
              list: 'overflow-x-auto overflow-y-hidden border-b-0 shadow-[inset_0_-1px_0_var(--ui-border)]',
              indicator: 'bottom-0',
              trigger: 'shrink-0'
            }"
          >
            <template #list-trailing>
              <div class="ms-auto hidden items-center gap-1 pb-1.5 sm:flex">
                <UInput
                  ref="searchInput"
                  v-model="search"
                  icon="i-lucide-search"
                  placeholder="Search articles…"
                  size="sm"
                  class="w-72"
                  aria-label="Search articles"
                >
                  <template #trailing>
                    <UButton
                      v-if="search"
                      icon="i-lucide-x"
                      aria-label="Clear search"
                      color="neutral"
                      variant="link"
                      size="xs"
                      class="-me-1"
                      @click="search = ''"
                    />
                    <UKbd v-else value="/" />
                  </template>
                </UInput>
                <UDropdownMenu :items="feeds" :content="{ align: 'end' }">
                  <UButton icon="i-lucide-rss" aria-label="RSS feeds" color="neutral" variant="ghost" size="sm" />
                </UDropdownMenu>
              </div>
            </template>
          </UTabs>

          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Search articles…"
            class="sm:hidden"
            aria-label="Search articles"
          />
        </div>

        <UBlogPosts v-if="articles.length" class="gap-y-12 lg:gap-y-14">
          <BlogPostCard
            v-for="(post, index) in articles.slice(0, limit)"
            :key="post.path"
            :post="post"
            :eager="index < 3"
          />
        </UBlogPosts>

        <UEmpty
          v-else-if="query"
          icon="i-lucide-search-x"
          :title="`No article matches “${query}”`"
          :actions="[{ label: 'Clear Search', color: 'neutral', variant: 'subtle', onClick: () => { search = '' } }]"
        />

        <UButton
          v-if="articles.length > limit"
          label="Show More"
          color="neutral"
          variant="subtle"
          class="self-center"
          @click="limit += PAGE_SIZE"
        />
      </section>
    </UPageBody>
  </UContainer>
</template>
