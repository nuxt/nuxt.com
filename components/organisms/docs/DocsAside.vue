<template>
  <nav>
    <DocsAsideTree :tree="tree" />
  </nav>
</template>

<script setup lang="ts">
import { findChildFromPath } from '~/utils/content'

const navigation = inject('navigation')

const route = useRoute()
const path = route.path.split('/').slice(0, 4).join('/')

const tree = computed(() => findChildFromPath(path, navigation)?.children)
</script>
