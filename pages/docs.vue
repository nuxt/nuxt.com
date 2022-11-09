<template>
  <Page :sticky="!!$route.params.slug">
    <template #header>
      <SubNavbar title="Docs" :links="links" />
    </template>

    <template v-if="$route.params.slug && tree && tree.length" #aside>
      <DocsAsideTree :tree="tree" />
    </template>

    <NuxtPage />
  </Page>
</template>

<script setup lang="ts">
const route = useRoute()
const { navigation } = useContent()
const { navPageFromPath } = useContentHelpers()

const links = computed(() => formatDocsNav(navPageFromPath('/docs', navigation.value)?.children))
const path = computed(() => route.path.split('/').slice(0, 3).join('/'))
const tree = computed(() => navPageFromPath(path.value, navigation.value)?.children)
</script>
