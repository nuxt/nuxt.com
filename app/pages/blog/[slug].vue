<script setup lang="ts">
import { kebabCase } from 'scule'

definePageMeta({
  heroBackground: 'opacity-30 -z-10'
})

const route = useRoute()
const { copy } = useClipboard()
const { track } = useAnalytics()
const { isAgentDocked } = useNuxtAgent()

const { articles, fetchList } = useBlog()

const [{ data: article }] = await Promise.all([
  useAsyncData(kebabCase(route.path), () => useContent('site').get(route.path)),
  fetchList()
])

if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: 'Article not found', fatal: true })
}

const articleData = computed(() => article.value!.data)

const tocLinks = computed<any[]>(() => (article.value?.meta as Record<string, any>)?.toc?.links ?? [])
const surround = computed(() => listSurround(articles.value, route.path))

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
useCanonical(`${route.path}.md`)

if (!articleData.value.image) {
  defineOgImage('Docs.takumi', {
    headline: 'Blog',
    title,
    description
  })
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

const socialLinks = computed(() =>
  !articleData.value
    ? []
    : [
        {
          label: 'LinkedIn',
          icon: 'i-simple-icons-linkedin',
          to: `https://www.linkedin.com/sharing/share-offsite/?url=https://nuxt.com${route.path}`,
          onClick: () => track('Blog Share', { platform: 'LinkedIn', article: articleData.value?.title })
        },
        {
          label: 'Bluesky',
          icon: 'i-simple-icons-bluesky',
          to: `https://bsky.app/intent/compose?text=${formatSocialIntentQueryText(authorHandles.bluesky)}`,
          onClick: () => track('Blog Share', { platform: 'Bluesky', article: articleData.value?.title })
        },
        {
          label: 'X',
          icon: 'i-simple-icons-x',
          to: `https://x.com/intent/tweet?text=${formatSocialIntentQueryText(authorHandles.twitter)}`,
          onClick: () => track('Blog Share', { platform: 'X', article: articleData.value?.title })
        }
      ]
)

function copyLink() {
  track('Blog Link Copied', { article: articleData.value?.title })
  copy(`https://nuxt.com${route.path}`, { title: 'Link copied to clipboard', icon: 'i-lucide-copy-check' })
}

const links = [
  {
    icon: 'i-lucide-pen',
    label: 'Edit this article',
    to: `https://github.com/nuxt/nuxt.com/edit/main/content/${article.value!.meta.stem}.md`,
    target: '_blank'
  }, {
    icon: 'i-lucide-star',
    label: 'Star on GitHub',
    to: 'https://go.nuxt.com/github',
    target: '_blank'
  }, {
    icon: 'i-lucide-hand-heart',
    label: 'Become a Sponsor',
    to: 'https://go.nuxt.com/sponsor',
    target: '_blank'
  }
]
</script>

<template>
  <UContainer>
    <UPage v-if="articleData">
      <UPageHeader :title="articleData.title" :description="articleData.description" :ui="{ headline: 'flex flex-col gap-y-8 items-start' }">
        <template #headline>
          <UBreadcrumb :items="[{ label: 'Blog', icon: 'i-lucide-newspaper', to: '/blog' }, { label: articleData.title }]" class="max-w-full" />
          <div class="flex items-center space-x-2">
            <span>
              {{ articleData.category }}
            </span>
            <span class="text-muted">&middot;&nbsp;&nbsp;<time>{{ formatDateByLocale('en', articleData.date) }}</time></span>
          </div>
        </template>

        <div class="mt-4 flex flex-wrap items-center gap-6">
          <UUser v-for="(author, index) in articleData.authors" :key="index" v-bind="author" :description="author.to ? `@${author.to.split('/').pop()}` : undefined" />
        </div>
      </UPageHeader>

      <UPage
        class="lg:gap-24"
        :ui="isAgentDocked ? {
          center: 'lg:col-span-10',
          right: 'lg:hidden'
        } : { root: 'lg:grid-cols-12', center: 'lg:col-span-9', right: 'lg:col-span-3' }"
      >
        <UPageBody>
          <MarkdownDocument v-if="article" :value="article" />

          <div class="flex items-center justify-between mt-12 not-prose">
            <ULink to="/blog" class="text-primary">
              ← Back to blog
            </ULink>
            <div class="flex justify-end items-center gap-1.5">
              <UButton icon="i-lucide-link" variant="ghost" color="neutral" @click="copyLink">
                <span class="sr-only">Copy URL</span>
                Copy URL
              </UButton>
              <UButton
                v-for="(link, index) in socialLinks"
                :key="index"
                v-bind="link"
                variant="ghost"
                color="neutral"
                target="_blank"
              >
                <span class="sr-only">Nuxt on {{ link.label }}</span>
              </UButton>
            </div>
          </div>

          <USeparator v-if="surround?.length" />

          <UContentSurround :surround="surround" />
        </UPageBody>

        <template #right>
          <UContentToc v-if="tocLinks.length" :links="tocLinks" title="Table of Contents" highlight highlight-variant="circuit">
            <template #bottom>
              <div class="hidden lg:block space-y-6">
                <UPageLinks title="Links" :links="links" />
                <USeparator type="dashed" />
                <SocialLinks />
              </div>
            </template>
          </UContentToc>
        </template>
      </UPage>
    </UPage>
  </UContainer>
</template>
