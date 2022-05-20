<template>
  <UContainer padded class="pb-16 sm:pb-32">
    <ul role="list" class="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
      <li v-for="data in articles" :key="data._path">
        <ResourcesBlogPost :page="data" />
      </li>
    </ul>
  </UContainer>
</template>

<script setup lang="ts">
const { data: articles } = await useAsyncData('resources-blog-list', () => queryContent('/resources/blog').where({
  $not: {
    _path: {
      $in: ['/resources/blog']
    }
  }
}).sort({ date: 0 }).skip(1).find())
</script>
