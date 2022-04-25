<template>
  <nav>
    <DocsAsideTree :tree="tree" />
  </nav>
</template>

<script setup lang="ts">
const { navFromPath } = useContent()

const route = useRoute()
const path = computed(() => route.path.split('/').slice(0, 5).join('/'))

const tree = computed(() => navFromPath(path.value)?.children)
</script>
