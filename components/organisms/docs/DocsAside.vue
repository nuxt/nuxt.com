<template>
  <nav>
    <DocsAsideTree :tree="tree" />
  </nav>
</template>

<script setup lang="ts">
const { navFromPath } = useContent()

const route = useRoute()
const path = route.path.split('/').slice(0, 4).join('/')

const tree = computed(() => navFromPath(path)?.children)
</script>
