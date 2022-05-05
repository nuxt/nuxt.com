<template>
  <UContainer padded>
    <ul role="list" class="flex flex-col gap-y-4 pb-16">
      <li v-for="(data, index) in blogData" :key="data.slug" :class="{ 'border-b last:border-none': index !== 0 }">
        <ResourcesBlogPost :page="data" :highlight="index === 0" />
      </li>
    </ul>
  </UContainer>
</template>

<script setup lang="ts">
const { data: blogData } = await useAsyncData('resources-blog', () => queryContent('/resources/blog').where({ $not: { slug: { $in: ['/resources/blog'] } } }).sortBy('date', 'desc').find())
</script>
