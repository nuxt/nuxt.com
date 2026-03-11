<script setup lang="ts">
import type { Release } from '#shared/types'

definePageMeta({
  heroBackground: 'opacity-0'
})

const title = 'Changelog'
const description = 'Discover the latest releases from Nuxt and the official modules.'

useSeoMeta({
  titleTemplate: '%s',
  title,
  description,
  ogDescription: description,
  ogTitle: title
})
defineOgImageComponent('Docs', {
  headline: 'Changelog',
  title,
  description
})

const { data: releases } = await useFetch('/api/releases')
const openStates = reactive<Record<string, boolean>>({})

const { modules } = useModules()
const { copy } = useClipboard()

const repoLinks = computed(() => {
  const links: Record<string, string> = { 'nuxt/nuxt': '/docs' }
  for (const mod of modules.value) {
    const repo = mod.repo?.split('#')[0]
    if (repo && mod.website) {
      links[repo] = mod.website
    }
  }
  return links
})

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function copyRelease(release: Release) {
  const md = `# ${release.title}\n\n${release.markdown}`
  copy(md, {
    title: 'Release notes copied!',
    description: `${release.title} markdown copied to clipboard.`,
    icon: 'i-lucide-clipboard-check'
  })
}
</script>

<template>
  <div class="xl:grid xl:grid-cols-2">
    <div class="relative border-b border-default xl:border-b-0 xl:sticky xl:inset-y-0 xl:h-screen overflow-hidden">
      <div class="absolute -right-1/2 z-[-1] rounded-full bg-primary blur-[300px] size-60 sm:size-100 transform -translate-y-1/2 top-1/2" />

      <div class="h-full flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 sm:py-16 xl:ps-[max(2rem,calc((100vw-var(--ui-container))/2+2rem))]">
        <h1 class="text-4xl sm:text-5xl font-bold text-highlighted tracking-tight">
          {{ title }}
        </h1>
        <p class="text-lg/7 text-muted max-w-sm mt-4">
          Latest changes, improvements, and fixes across Nuxt core and the official modules.
        </p>

        <div class="flex items-center gap-1 mt-8 -ms-2.5">
          <UButton
            to="https://github.com/nuxt/nuxt/releases"
            target="_blank"
            icon="i-simple-icons-github"
            label="GitHub"
            variant="ghost"
            color="neutral"
          />
          <UButton
            to="/blog"
            icon="i-lucide-newspaper"
            label="Blog"
            variant="ghost"
            color="neutral"
          />
          <UButton
            to="/changelog/rss.xml"
            external
            icon="i-lucide-rss"
            label="RSS"
            variant="ghost"
            color="neutral"
          />
        </div>
      </div>
    </div>

    <section class="px-4 sm:px-6 xl:px-0 xl:-ms-30 xl:flex-1">
      <UChangelogVersions
        as="main"
        :indicator-motion="false"
        :ui="{
          root: 'py-16 sm:py-24 lg:py-32',
          indicator: 'inset-y-0'
        }"
      >
        <UChangelogVersion
          v-for="release in releases"
          :key="release.tag"
          :to="release.url"
          target="_blank"
          :title="release.title"
          :date="formatDate(release.date)"
          :ui="{
            root: 'flex items-start',
            container: 'max-w-xl 2xl:mx-12 w-full relative',
            header: 'border-b border-default pb-4',
            title: 'text-2xl sm:text-3xl tracking-tight',
            date: 'text-xs text-muted font-mono tabular-nums',
            indicator: 'sticky top-0 pt-16 -mt-16 sm:pt-24 sm:-mt-24 lg:pt-32 lg:-mt-32'
          }"
        >
          <template #header>
            <div class="flex items-start justify-between gap-4">
              <div class="flex flex-col gap-1.5">
                <UButton
                  :label="release.repo === 'nuxt/nuxt' ? 'nuxt' : `@${release.repo}`"
                  :to="repoLinks[release.repo]"
                  :target="repoLinks[release.repo]?.startsWith('http') ? '_blank' : undefined"
                  variant="outline"
                  :color="release.repo === 'nuxt/nuxt' ? 'primary' : 'neutral'"
                  size="xs"
                  class="w-fit"
                />
                <NuxtLink :to="release.url" target="_blank" class="text-2xl sm:text-3xl tracking-tight font-semibold text-highlighted hover:text-primary transition-colors">
                  {{ release.title }}
                </NuxtLink>
              </div>
              <UButton
                label="Copy release"
                size="xs"
                color="neutral"
                variant="link"
                @click.prevent="copyRelease(release)"
              />
            </div>
          </template>

          <template #body>
            <div
              class="relative"
              :class="{
                'h-auto min-h-[200px]': openStates[release.tag],
                'h-[200px] overflow-y-hidden': !openStates[release.tag] && release.body.children.length > 4
              }"
            >
              <MDCRenderer
                v-if="release.body"
                :body="release.body"
                style="zoom: 0.85"
              />
              <div
                v-if="!openStates[release.tag] && release.body.children.length > 4"
                class="h-16 absolute inset-x-0 bottom-0 flex items-end justify-center bg-linear-to-t from-default to-default/50"
              >
                <UButton
                  size="sm"
                  icon="i-lucide-chevron-down"
                  color="neutral"
                  variant="outline"
                  label="Expand release"
                  class="group"
                  @click="openStates[release.tag] = true"
                />
              </div>
            </div>
            <div v-if="openStates[release.tag]" class="flex justify-center pt-4">
              <UButton
                size="sm"
                icon="i-lucide-chevron-up"
                color="neutral"
                variant="outline"
                label="Collapse release"
                @click="openStates[release.tag] = false"
              />
            </div>
          </template>
        </UChangelogVersion>
      </UChangelogVersions>
    </section>
  </div>
</template>
