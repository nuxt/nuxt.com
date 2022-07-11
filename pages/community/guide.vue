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

const tree = computed(() => navFromPath('/docs/3.x/community')?.children)
</script>
