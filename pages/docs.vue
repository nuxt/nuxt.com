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
const { navFromPath } = usePage()

const links = computed(() => navFromPath('/docs')?.children.filter(link => !['/docs/migration', '/docs/bridge'].includes(link._path)))
const path = computed(() => route.path.split('/').slice(0, 3).join('/'))
const tree = computed(() => navFromPath(path.value)?.children)
</script>
