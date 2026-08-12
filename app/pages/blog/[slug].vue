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
  useAsyncData(kebabCase(route.path), () => clientContent.get(route.path)),
  fetchList()
])

if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: 'Article not found', fatal: true })
}

const title = article.value.data.seo?.title || article.value.data.title
const description = article.value.data.seo?.description || article.value.data.description

useSeoMeta({
  titleTemplate: '%s · Nuxt Blog',
  title,
  description,
  ogDescription: description,
  ogTitle: `${title} · Nuxt Blog`,
  ...(article.value.data.image ? { ogImage: article.value.data.image } : {})
})
useCanonical(`${route.path}.md`)

if (!article.value.data.image) {
  defineOgImage('Docs.takumi', {
    headline: 'Blog',
    title,
    description
  })
}

const surround = computed(() => {
  const index = articles.value.findIndex(item => item.path === route.path)
  if (index === -1) {
    return []
  }
  return [articles.value[index - 1], articles.value[index + 1]]
    .map(item => item ? { title: item.title, path: item.path, description: item.description } : undefined)
})

function formatSocialIntentQueryText(handle: string | undefined): string {
  const credit = handle ? ` by @${handle}` : ''
  const body = article.value.data.title + credit
  const link = `https://nuxt.com${article.value.path}`
  return encodeURIComponent(`${body}\n\n${link}`)
}

const authorHandles: { twitter?: string, bluesky?: string } = {
  twitter: article.value.data.authors?.[0]?.twitter,
  bluesky: article.value.data.authors?.[0]?.bluesky
}

const socialLinks = computed(() =>
  !article.value
    ? []
    : [
        {
          label: 'LinkedIn',
          icon: 'i-simple-icons-linkedin',
          to: `https://www.linkedin.com/sharing/share-offsite/?url=https://nuxt.com${article.value.path}`,
          onClick: () => track('Blog Share', { platform: 'LinkedIn', article: article.value?.data.title })
        },
        {
          label: 'Bluesky',
          icon: 'i-simple-icons-bluesky',
          to: `https://bsky.app/intent/compose?text=${formatSocialIntentQueryText(authorHandles.bluesky)}`,
          onClick: () => track('Blog Share', { platform: 'Bluesky', article: article.value?.data.title })
        },
        {
          label: 'X',
          icon: 'i-simple-icons-x',
          to: `https://x.com/intent/tweet?text=${formatSocialIntentQueryText(authorHandles.twitter)}`,
          onClick: () => track('Blog Share', { platform: 'X', article: article.value?.data.title })
        }
      ]
)

function copyLink() {
  track('Blog Link Copied', { article: article.value?.data.title })
  copy(`https://nuxt.com${article.value?.path || '/'}`, { title: 'Link copied to clipboard', icon: 'i-lucide-copy-check' })
}

const links = [
  {
    icon: 'i-lucide-pen',
    label: 'Edit this article',
    to: `https://github.com/nuxt/nuxt.com/edit/main/content/${article.value.meta.stem}.md`,
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
    <UPage v-if="article">
      <UPageHeader :title="article.data.title" :description="article.data.description" :ui="{ headline: 'flex flex-col gap-y-8 items-start' }">
        <template #headline>
          <UBreadcrumb :items="[{ label: 'Blog', icon: 'i-lucide-newspaper', to: '/blog' }, { label: article.data.title }]" class="max-w-full" />
          <div class="flex items-center space-x-2">
            <span>
              {{ article.data.category }}
            </span>
            <span class="text-muted">&middot;&nbsp;&nbsp;<time>{{ formatDateByLocale('en', article.data.date) }}</time></span>
          </div>
        </template>

        <div class="mt-4 flex flex-wrap items-center gap-6">
          <UUser v-for="(author, index) in article.data.authors" :key="index" v-bind="author" :description="author.to ? `@${author.to.split('/').pop()}` : undefined" />
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
          <MarkdownDocument v-if="article.nodes?.length" :value="article" />

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
          <UContentToc v-if="!isAgentDocked && article.meta?.toc" :links="article.meta.toc.links" title="Table of Contents" highlight highlight-variant="circuit">
            <template #bottom>
              <div class="hidden lg:block space-y-6">
                <UPageLinks title="Links" :links="links" />
                <USeparator type="dashed" />
                <SocialLinks />
                <Ads />
              </div>
            </template>
          </UContentToc>
        </template>
      </UPage>
    </UPage>
  </UContainer>
</template>
