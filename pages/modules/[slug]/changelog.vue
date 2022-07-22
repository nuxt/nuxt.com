<template>
  <Page reverse class="overflow-hidden">
    <GithubReleases v-slot="{ releases }" :query="githubQuery">
      <div v-for="release in releases" :key="release.name" class="mb-11">
        <div class="flex gap-3 items-center mb-7">
          <UIcon name="bx:git-commit" class="w-8 h-8" />
          <h2 class="flex items-center gap-2 text-2xl u-text-gray-900 font-semibold">
            <span>{{ release.name }} by </span>
            <UAvatar size="xs" :src="release.author.avatar" :alt="release.author.name" />
            <span>{{ release.author.name }}</span>
          </h2>
        </div>
        <ContentRenderer :value="release" class="ml-10 prose dark:prose-invert max-w-none" />
      </div>
    </GithubReleases>
    <template #aside>
      <GithubContributors v-slot="{ contributors }" :query="githubQuery">
        <div class="p-5 u-bg-gray-50 border u-border-gray-100 rounded-md">
          <div class="u-text-gray-900 font-semibold mb-2">
            Contributors
          </div>
          <div
            v-for="contributor in contributors.slice(0, 10)"
            :key="contributor.label"
            class="flex gap-2 items-center mb-2"
          >
            <UAvatar size="xs" :src="contributor.avatar_url" :alt="contributor.login" />
            <span class="u-text-gray-700 text-sm">{{ contributor.login }}</span>
          </div>
          <UButton
            class="u-text-gray-700 px-1"
            icon="fa-brands:github"
            variant="transparent"
            :to="`${module.github}/graphs/contributors`"
            label="More on Github"
            target="_blank"
          />
        </div>
      </GithubContributors>
    </template>
  </Page>
</template>

<script setup lang="ts">
const { githubQuery, module } = useModules()
</script>
