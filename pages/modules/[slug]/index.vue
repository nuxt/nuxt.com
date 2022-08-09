<template>
  <Page reverse class="overflow-hidden md:overflow-visible">
    <template #aside>
      <div class="p-5 u-bg-gray-50 border u-border-gray-100 rounded-md">
        <div class="u-text-gray-900 font-semibold mb-4">
          Useful links
        </div>

        <div class="flex flex-col gap-2">
          <NuxtLink
            v-for="(link, index) in links"
            :key="index"
            :to="link.href"
            target="_blank"
            class="flex items-center gap-2 text-sm font-medium hover:u-text-gray-900 focus:u-text-gray-900"
            tabindex="-1"
          >
            <UIcon name="fa-brands:github" class="w-4 h-4" />
            {{ link.label }}
          </NuxtLink>
        </div>
      </div>
    </template>

    <ContentRenderer v-if="readme" :value="readme" class="prose dark:prose-invert prose-green max-w-none" />
    <!-- Readme placeholder -->
    <div v-else class="u-bg-gray-100 animate-pulse w-full h-screen" />
  </Page>
</template>

<script setup lang="ts">
const { githubQuery, module } = useModules()
const { fetchReadme } = useGithub()

const { data: readme } = await useAsyncData(
  `readme:${githubQuery.value.owner}:${githubQuery.value.repo}`,
  () => fetchReadme(githubQuery.value)
)

const links = computed(() => {
  return [{
    label: 'View source',
    href: module.value.github
  }, {
    label: 'Report an issue',
    href: `${module.value.github}/issues/new/choose`
  }, {
    label: 'Learn more',
    href: module.value.website
  }]
})
</script>
