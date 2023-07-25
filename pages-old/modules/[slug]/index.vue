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
            <Icon :name="link.icon || 'fa-brands:github'" class="w-4 h-4" />
            {{ link.label }}
          </NuxtLink>
        </div>
      </div>
    </template>

    <GithubReadme v-slot="{ readme }" :query="githubQuery">
      <ContentRenderer v-if="readme" :value="readme" class="max-w-none" />
    </GithubReadme>
  </Page>
</template>

<script setup lang="ts">
const { githubQuery, module } = useModules()

const links = computed(() => {
  return [{
    label: 'View source',
    href: module.value.github
  }, {
    label: 'Report an issue',
    href: `${module.value.github}/issues/new/choose`
  }, {
    label: 'Learn more',
    href: module.value.website,
    icon: 'uil:link'
  }]
})
</script>
