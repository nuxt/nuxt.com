<template>
  <Page>
    <NuxtPage />
    <template v-if="$route.params.slug && tree && tree.length" #aside>
      <DocsAsideTree :tree="tree" />
    </template>
  </Page>
</template>

<script setup lang="ts">
const { navFromPath } = usePage()

const tree = computed(() => navFromPath('/docs/community')?.children.map((navItem) => {
  return {
    ...navItem,
    _path: navItem._path.replace('/docs/community', '/community/guide')
  }
}))
</script>
