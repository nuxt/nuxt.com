<template>
  <UContainer padded>
    <ul role="list" class="grid grid-cols-1 gap-8 pb-16 sm:grid-cols-2 xl:grid-cols-3">
      <li v-for="data in articles" :key="data.path">
        <ResourcesBlogPost :page="data" />
      </li>
    </ul>
  </UContainer>
</template>

<script setup lang="ts">
const { data: articles } = await useAsyncData('resources-blog-list', () => queryContent('/resources/blog').where({ $not: { path: { $in: ['/resources/blog'] } } }).sortBy('date', 'desc').skip(1).find())
</script>
