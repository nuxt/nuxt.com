<template>
  <nav>
    <DocsAsideTree :tree="tree" />
  </nav>
</template>

<script setup lang="ts">
const props = defineProps({
  level: {
    type: Number,
    required: true
  }
})

const { navFromPath } = useContent()

const route = useRoute()

const path = computed(() => route.path.split('/').slice(0, props.level).join('/'))
const tree = computed(() => navFromPath(path.value)?.children)
</script>
