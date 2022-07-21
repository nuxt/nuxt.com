<template>
  <Page class="-mx-8" reverse>
    <ContentRenderer v-if="readme" :value="readme" class="prose dark:prose-invert max-w-none" />
    <template #aside>
      <div class="p-5 u-bg-gray-50 border u-border-gray-100 rounded-md">
        <div class="u-text-gray-900 font-semibold mb-2">
          Useful Links
        </div>
        <UButton
          v-for="link in links"
          :key="link.label"
          class="u-text-gray-700 px-0"
          icon="fa-brands:github"
          variant="transparent"
          :to="link.href"
          :label="link.label"
          target="_blank"
        />
      </div>
    </template>
  </Page>
</template>

<script setup lang="ts">
const { githubQuery, module } = useModules()
const { fetchReadme } = useGithub()

const { data } = await useAsyncData(`module:${githubQuery.value.owner}:${githubQuery.value.repo}:readme`, () => fetchReadme(githubQuery.value))

const readme = computed(() => {
  // Remove image if exists in top of readme
  if (JSON.stringify(data.value.body.children[0]).includes('img')) {
    data.value.body.children.shift()
  }

  return data.value
})

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
