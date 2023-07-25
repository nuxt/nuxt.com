<template>
  <Page reverse class="overflow-hidden md:overflow-visible">
    <template #aside>
      <GithubContributors v-slot="{ contributors }" :query="githubQuery">
        <div class="p-5 u-bg-gray-50 border u-border-gray-100 rounded-md">
          <div class="u-text-gray-900 font-semibold mb-4">
            Contributors
          </div>

          <div class="flex flex-col gap-2 mb-4">
            <NuxtLink
              v-for="contributor in contributors.slice(0, 10)"
              :key="contributor.label"
              :to="`https://github.com/${contributor.login}`"
              target="_blank"
              class="flex items-center gap-2 text-sm font-medium hover:u-text-gray-900 focus:u-text-gray-900"
            >
              <AppAvatar size="xxxs" :src="contributor.avatar_url" :alt="contributor.login" />
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
              <Icon name="fa-brands:github" class="w-4 h-4" />
              More on GitHub
            </NuxtLink>
          </div>
        </div>
      </GithubContributors>
    </template>

    <GithubReleases v-slot="{ releases }" :query="githubQuery">
      <div v-for="release in releases" :key="release.name" class="mb-12">
        <div class="flex gap-3 items-center mb-7">
          <Icon name="bx:git-commit" class="w-8 h-8" />
          <h2 class="flex items-center gap-2 text-2xl u-text-gray-900 font-semibold">
            <span>{{ release.name }} by </span>
            <AppAvatar size="xs" :src="release.author.avatar" :alt="release.author.name" />
            <span>{{ release.author.name }}</span>

            <time class="u-text-gray-500 font-normal text-xl leading-8">{{ formatDateByLocale('en', release.date) }}</time>
          </h2>
        </div>
        <ContentRenderer :value="release" class="ml-10 prose dark:prose-invert prose-green max-w-none" />
      </div>
    </GithubReleases>
  </Page>
</template>

<script setup lang="ts">
const { githubQuery, module } = useModules()
</script>
