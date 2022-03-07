<template>
  <div class="prose dark:prose-invert !max-w-full">
    <Content v-if="page" :id="page.id" class="" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

const { findOne } = useContentQuery(route.path)

const { data: page } = await useAsyncData('docs-page-content', findOne)
</script>
