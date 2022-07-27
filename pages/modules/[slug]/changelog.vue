<template>
  <Page reverse class="overflow-hidden md:overflow-visible">
    <template #aside>
      <div class="p-5 u-bg-gray-50 border u-border-gray-100 rounded-md">
        <div class="u-text-gray-900 font-semibold mb-4">
          Contributors
        </div>

        <div class="flex flex-col gap-2 mb-4">
          <!-- Contributors placeholder -->
          <template v-if="!contributors">
            <div
              v-for="i in [...Array(10).keys()]"
              :key="i"
              class="u-bg-gray-200 animate-pulse w-3/4 h-5"
            />
          </template>
          <NuxtLink
            v-for="(contributor, index) in (contributors || []).slice(0, 10)"
            :key="index"
            :to="`https://github.com/${contributor.login}`"
            target="_blank"
            class="flex items-center gap-2 text-sm font-medium hover:u-text-gray-900 focus:u-text-gray-900"
          >
            <UAvatar size="xxxs" :src="contributor.avatar_url" :alt="contributor.login" />
            {{ contributor.login }}
          </NuxtLink>
        </div>

        <div class="flex flex-col gap-2 pt-4 border-t u-border-gray-200">
          <NuxtLink
            :to="`${module.github}/graphs/contributors`"
            target="_blank"
            class="flex items-center gap-2 text-sm font-medium hover:u-text-gray-900 focus:u-text-gray-900"
            tabindex="-1"
          >
            <UIcon name="fa-brands:github" class="w-4 h-4" />
            More on GitHub
          </NuxtLink>
        </div>
      </div>
    </template>

    <!-- Releases placeholder -->
    <div v-if="!releases" class="u-bg-gray-100 animate-pulse w-full h-screen" />
    <div v-for="release in releases" :key="release.name" class="mb-12">
      <div class="flex flex-col md:flex-row gap-3 items-center mb-7 mt-3 md:mt-0">
        <UIcon name="bx:git-commit" class="w-8 h-8" />
        <h2 class="flex items-center gap-2 text-2xl u-text-gray-900 font-semibold">
          <span>{{ release.name }} by </span>
          <UAvatar size="xs" :src="release.author.avatar" :alt="release.author.name" />
          <span>{{ release.author.name }}</span>
        </h2>
        <time class="u-text-gray-500 font-normal text-xl leading-8">{{ formatDateByLocale('en', release.date) }}</time>
      </div>
      <ContentRenderer :value="release" class="ml-10 prose dark:prose-invert prose-green max-w-none" />
    </div>
  </Page>
</template>

<script setup lang="ts">
import { formatDateByLocale } from '~/utils'

const { githubQuery, module } = useModules()
const { fetchReleases, fetchContributors } = useGithub()

const { data: releases } = useAsyncData(
  `releases:${githubQuery.value.owner}:${githubQuery.value.repo}`,
  () => fetchReleases(githubQuery.value),
  { lazy: true }
)

const { data: contributors } = useAsyncData(
  `contributors:${githubQuery.value.owner}:${githubQuery.value.repo}`,
  () => fetchContributors(githubQuery.value),
  { lazy: true }
)
</script>
