<script setup lang="ts">
import type { Node } from 'comark'
import type { TocLink } from 'comark/plugins/toc'
import type { DropdownMenuItem } from '@nuxt/ui'
import type { BlogArticle } from '#shared/types'
import { kebabCase } from 'scule'
import {
  DocsProseImg,
  AgentNuxiIcon,
  ArticleVideo,
  Carousel,
  Important,
  IndexExample,
  NuxiMoodGallery,
  ReadMore,
  ThemedVideo,
  TryNuxi,
  VideoAccordion,
  YoutubeDemo
} from '#components'
import { plainHeading } from '#shared/utils/heading'
import { readingMinutes } from '#shared/utils/reading-time'

definePageMeta({
  heroBackground: false
})

const markdownComponents = {
  ...proseComponents,
  ProseImg: DocsProseImg,
  AgentNuxiIcon,
  ArticleVideo,
  Carousel,
  Important,
  IndexExample,
  NuxiMoodGallery,
  ReadMore,
  ThemedVideo,
  TryNuxi,
  VideoAccordion,
  YoutubeDemo
}

const NUXT_3_BETA_DATE = new Date('2021-10-11')

const route = useRoute()
const { copy } = useClipboard()
const { track } = useAnalytics()
const { open: openAgent, isAgentDocked } = useNuxtAgent()

const { posts, ready } = useBlogPosts()

const [{ data: article }] = await Promise.all([
  useAsyncData(kebabCase(route.path), () => useContent('site').get(route.path)),
  ready
])

if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: 'Article not found', fatal: true })
}

const articleData = computed(() => article.value!.data as BlogArticle)
const category = computed(() => BLOG_CATEGORIES.find(item => item.value === articleData.value.category) ?? BLOG_CATEGORIES[0]!)
const readingTime = computed(() => readingMinutes(article.value?.nodes as Node[] | undefined))
const coversNuxt2 = computed(() => new Date(articleData.value.date) < NUXT_3_BETA_DATE)

const tocLinks = computed(() => (article.value?.meta as { toc?: { links: TocLink[] } })?.toc?.links ?? [])
const surround = computed(() => listSurround(posts.value.filter(item => item.category === 'Release'), route.path))
const related = computed(() => {
  const others = posts.value.filter(item => item.path !== route.path && item.category !== 'Release')
  return [
    ...others.filter(item => item.category === category.value.value),
    ...others.filter(item => item.category !== category.value.value)
  ].slice(0, 3)
})

const title = articleData.value.seo?.title || articleData.value.title
const description = articleData.value.seo?.description || articleData.value.description

useSeoMeta({
  titleTemplate: '%s · Nuxt Blog',
  title,
  description,
  ogDescription: description,
  ogTitle: `${title} · Nuxt Blog`,
  ...(articleData.value.image ? { ogImage: articleData.value.image } : {})
})
useCanonical(`/raw${route.path}.md`)

if (!articleData.value.image) {
  defineOgImage('Docs.takumi', {
    headline: 'Blog',
    title,
    description
  })
}

const articleBody = useTemplateRef<HTMLElement>('articleBody')
const showToc = computed(() => !isAgentDocked.value && tocLinks.value.length > 1)
const contents = computed(() => tocLinks.value.flatMap((link): DropdownMenuItem[] => [
  { label: plainHeading(link.text), to: `#${link.id}` },
  ...(link.children ?? []).map(child => ({ label: plainHeading(child.text), to: `#${child.id}`, class: 'ps-6' }))
]))

function authorSeparator(index: number) {
  const remaining = (articleData.value.authors?.length ?? 0) - index - 1
  return remaining === 0 ? '' : remaining === 1 ? ' and ' : ', '
}

function formatSocialIntentQueryText(handle: string | undefined): string {
  const credit = handle ? ` by @${handle}` : ''
  const body = articleData.value.title + credit
  const link = `https://nuxt.com${route.path}`
  return encodeURIComponent(`${body}\n\n${link}`)
}

const authorHandles: { twitter?: string, bluesky?: string } = {
  twitter: articleData.value.authors?.[0]?.twitter,
  bluesky: articleData.value.authors?.[0]?.bluesky
}

const socialLinks = computed<DropdownMenuItem[]>(() =>
  !articleData.value
    ? []
    : [
        {
          label: 'Copy Link',
          icon: 'i-lucide-link',
          onSelect: copyLink
        },
        {
          label: 'LinkedIn',
          icon: 'i-simple-icons-linkedin',
          to: `https://www.linkedin.com/sharing/share-offsite/?url=https://nuxt.com${route.path}`,
          target: '_blank',
          onSelect: () => track('Blog Share', { platform: 'LinkedIn', article: articleData.value?.title })
        },
        {
          label: 'Bluesky',
          icon: 'i-simple-icons-bluesky',
          to: `https://bsky.app/intent/compose?text=${formatSocialIntentQueryText(authorHandles.bluesky)}`,
          target: '_blank',
          onSelect: () => track('Blog Share', { platform: 'Bluesky', article: articleData.value?.title })
        },
        {
          label: 'X',
          icon: 'i-simple-icons-x',
          to: `https://x.com/intent/tweet?text=${formatSocialIntentQueryText(authorHandles.twitter)}`,
          target: '_blank',
          onSelect: () => track('Blog Share', { platform: 'X', article: articleData.value?.title })
        }
      ]
)

function copyLink() {
  track('Blog Link Copied', { article: articleData.value?.title })
  copy(`https://nuxt.com${route.path}`, { title: 'Link copied to clipboard', icon: 'i-lucide-copy-check' })
}

function askNuxi() {
  openAgent(`Summarize the key takeaways of the Nuxt blog post "${articleData.value.title}" (https://nuxt.com${route.path}) and show how I can apply them in my app.`)
}
</script>

<template>
  <UContainer>
    <article
      class="mx-auto max-w-3xl pt-10 pb-20 sm:pt-16"
      :class="showToc && 'xl:grid xl:max-w-none xl:grid-cols-[minmax(0,1fr)_minmax(0,48rem)_minmax(13rem,1fr)] xl:gap-x-12'"
    >
      <header class="flex flex-col gap-6 pb-8 xl:col-start-2">
        <p class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
          <NuxtLink
            :to="`/updates?category=${category.slug}`"
            class="font-medium text-primary hover:text-highlighted focus-visible:outline-primary"
          >
            {{ category.label }}
          </NuxtLink>
          <span aria-hidden="true">·</span>
          <time :datetime="articleData.date">{{ formatShortDate(articleData.date) }}</time>
          <span aria-hidden="true">·</span>
          <span>{{ readingTime }} min read</span>
        </p>

        <div class="flex flex-col gap-4">
          <h1 class="text-3xl text-balance text-highlighted sm:text-4xl lg:text-5xl">
            {{ articleData.title }}
          </h1>
          <p v-if="articleData.description" class="text-lg text-pretty text-muted sm:text-xl">
            {{ articleData.description }}
          </p>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <div class="flex items-center gap-2.5 text-sm text-muted">
            <UAvatarGroup size="sm">
              <UAvatar
                v-for="author in articleData.authors"
                :key="author.name"
                :src="author.avatar?.src"
                :alt="author.name"
              />
            </UAvatarGroup>
            <span>
              <template v-for="(author, index) in articleData.authors" :key="author.name">
                <ULink
                  :to="author.to"
                  target="_blank"
                  class="font-medium text-highlighted hover:text-primary focus-visible:outline-primary"
                >{{ author.name }}</ULink>{{ authorSeparator(index) }}
              </template>
            </span>
          </div>

          <div class="flex items-center gap-1.5">
            <PageHeaderLinks />
            <UDropdownMenu :items="socialLinks" :content="{ align: 'end' }">
              <UButton
                icon="i-lucide-share"
                color="neutral"
                variant="soft"
                size="sm"
                aria-label="Share"
                :ui="{ leadingIcon: 'size-3.5' }"
              />
            </UDropdownMenu>
            <UDropdownMenu
              v-if="contents.length"
              :items="contents"
              :content="{ align: 'end' }"
              :ui="{ content: 'max-h-96 w-72 overflow-y-auto' }"
            >
              <UButton
                icon="i-lucide-list"
                color="neutral"
                variant="soft"
                size="sm"
                aria-label="Contents"
                :class="showToc && 'xl:hidden'"
                :ui="{ leadingIcon: 'size-3.5' }"
              />
            </UDropdownMenu>
          </div>
        </div>
      </header>

      <aside v-if="showToc" class="hidden xl:col-start-3 xl:row-start-2 xl:block">
        <BlogToc
          :links="tocLinks"
          :reading-time="readingTime"
          :target="articleBody"
          class="sticky top-[calc(var(--ui-header-height)+2rem)]"
        />
      </aside>

      <div ref="articleBody" class="min-w-0 xl:col-start-2 xl:row-start-2">
        <UAlert
          v-if="coversNuxt2"
          icon="i-lucide-history"
          color="warning"
          variant="subtle"
          title="This article covers Nuxt 2"
          description="Nuxt 2 reached end of life on June 30, 2024, and some of the APIs below no longer exist in Nuxt 4."
          :actions="[
            { label: 'Upgrade Guide', to: '/docs/getting-started/upgrade', color: 'warning', variant: 'solid', size: 'xs' },
            { label: 'Nuxt 4 Docs', to: '/docs', color: 'warning', variant: 'outline', size: 'xs' }
          ]"
          class="mb-8"
        />

        <MarkdownDocument :value="article!" :components="markdownComponents" />

        <div class="mt-16 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-default pt-6">
          <UButton label="Ask Nuxi About This Post" color="neutral" variant="link" class="px-0" @click="askNuxi">
            <template #leading>
              <AgentNuxiIcon class="size-4 text-primary" :interactive="false" />
            </template>
          </UButton>
          <UButton
            label="Edit This Post"
            icon="i-lucide-pen"
            :to="`https://github.com/nuxt/nuxt.com/edit/main/content/${article!.meta.stem}.md`"
            target="_blank"
            color="neutral"
            variant="link"
            class="px-0"
          />
        </div>
      </div>
    </article>

    <section
      v-if="category.value === 'Release'"
      aria-labelledby="releases-heading"
      class="flex flex-col gap-6 border-t border-default pt-12 pb-24"
    >
      <h2 id="releases-heading" class="text-2xl text-highlighted">
        Release History
      </h2>
      <UContentSurround :surround="surround" />
    </section>

    <section
      v-else-if="related.length"
      aria-labelledby="related-heading"
      class="flex flex-col gap-8 border-t border-default pt-12 pb-24"
    >
      <div class="flex items-center justify-between gap-4">
        <h2 id="related-heading" class="text-2xl text-highlighted">
          More from {{ category.label }}
        </h2>
        <UButton
          :to="`/updates?category=${category.slug}`"
          label="View All"
          trailing-icon="i-lucide-arrow-right"
          color="neutral"
          variant="link"
        />
      </div>
      <UBlogPosts>
        <BlogPostCard v-for="item in related" :key="item.path" :post="item" />
      </UBlogPosts>
    </section>
  </UContainer>
</template>
