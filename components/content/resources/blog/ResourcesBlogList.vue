<template>
  <UContainer padded>
    <ul role="list" class="grid grid-cols-1 gap-8 pb-16 sm:grid-cols-2 xl:grid-cols-3">
      <li v-for="data in articles" :key="data.slug">
        <ResourcesBlogPost :page="data" />
      </li>
    </ul>
  </UContainer>
</template>

<script setup lang="ts">
const { data: blogData } = await useAsyncData('resources-blog-list', () => queryContent('/resources/blog').where({ $not: { slug: { $in: ['/resources/blog'] } } }).sortBy('date', 'desc').find())

// skip first article (displayed in Hero)
const articles = blogData.value.slice(1)
</script>
