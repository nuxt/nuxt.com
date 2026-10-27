<script setup lang="ts">
import { joinURL } from 'ufo'

definePageMeta({
  heroBackground: 'opacity-80 -z-10'
})

const { data: page } = await useAsyncData('showcase', () => useContent('site').get('/showcase'))
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const pageData = computed(() => page.value!.data)

const route = useRoute()
const router = useRouter()
const toSlug = (industry: string) => industry.toLowerCase().replace(/[^a-z]+/g, '-')
const industry = computed({
  get: () => (pageData.value.wall.filters as string[]).find(filter => toSlug(filter) === route.query.industry),
  set: value => router.replace({ query: { ...route.query, industry: value ? toSlug(value) : undefined } })
})
const websites = computed(() => industry.value
  ? pageData.value.websites.filter((website: { industry?: string }) => website.industry === industry.value)
  : pageData.value.websites
)

const title = pageData.value.head?.title || pageData.value.title
const description = pageData.value.head?.description || pageData.value.description

const site = useSiteConfig()

// Rendered by `scripts/showcase-og.mjs`; platforms that don't animate GIFs show the first frame.
const socialImage = joinURL(site.url, '/showcase-social.gif')

useSeoMeta({
  titleTemplate: '%s',
  title,
  description,
  ogDescription: description,
  ogTitle: title,
  ogImage: socialImage,
  ogImageType: 'image/gif',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterImage: socialImage
})
useCanonical()
</script>

<template>
  <UPage v-if="pageData">
    <UPageHero
      :description="pageData.description"
      :ui="{
        container: '!pb-12',
        title: 'text-left',
        description: 'text-left'
      }"
    >
      <template #title>
        {{ pageData.hero.title }}<br><span class="text-primary">{{ pageData.hero.highlight }}</span>
      </template>
    </UPageHero>

    <UPageBody>
      <UContainer>
        <ShowcaseStats />
      </UContainer>

      <UContainer>
        <h2 class="mb-4 text-lg font-medium text-highlighted">
          {{ pageData.wall.title }}
        </h2>
        <div class="mb-4 flex items-center justify-between gap-4">
          <div class="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-1 overflow-x-auto [scrollbar-width:none]">
            <UButton
              v-for="filter in [undefined, ...pageData.wall.filters]"
              :key="filter ?? 'all'"
              :label="filter ?? 'All'"
              :aria-pressed="industry === filter"
              :variant="industry === filter ? 'soft' : 'ghost'"
              color="neutral"
              :class="industry === filter ? 'text-highlighted' : 'text-muted'"
              class="shrink-0 rounded-full"
              size="sm"
              @click="industry = filter"
            />
          </div>
          <p class="hidden lg:block pointer-coarse:hidden shrink-0 text-xs text-dimmed">
            {{ pageData.wall.hint }}
          </p>
        </div>
        <ShowcaseWall :websites="websites" />
      </UContainer>
    </UPageBody>
  </UPage>
</template>
