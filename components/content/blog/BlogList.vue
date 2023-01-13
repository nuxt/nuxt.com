<template>
  <UContainer padded class="pb-16 sm:pb-32">
    <ul role="list" class="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
      <li v-for="data in articles" :key="data._path">
        <BlogPost :page="data" />
      </li>
    </ul>
  </UContainer>
</template>

<script setup lang="ts">
import type { ResourcesBlogArticle } from '../../../types'
const { data: articles } = await useAsyncData('resources-blog-list', () => queryContent<ResourcesBlogArticle>('/blog').where({
  _extension: 'md'
}).sort({ date: -1 }).skip(1).find())

console.log({ articles })
</script>
