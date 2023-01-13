<template>
  <NuxtLink :to="page._path" class="relative overflow-hidden group rounded-xl bg-gradient">
    <div class="absolute inset-0 transition-opacity bg-overlay opacity-20 group-hover:opacity-40" />
    <div class="relative flex flex-col p-8">
      <div class="font-semibold text-white">
        <time>{{ formatDateByLocale('en', page.date) }}</time>
      </div>
      <h2 class="mt-4 text-3xl font-semibold text-white">
        {{ page.title }}
      </h2>
      <p class="mt-6 text-white line-clamp-3">
        {{ page.description }}
      </p>
      <div class="flex items-center justify-between mt-6">
        <span class="flex items-center text-xl font-semibold text-white gap-x-2">
          Read article<UIcon name="uil:arrow-right" class="w-5 h-5 mt-1" />
        </span>
        <UAvatarGroup :group="authors" size="sm" />
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { formatDateByLocale } from '~/utils'
import type { ResourcesBlogArticle } from '~/types'
const props = defineProps({
  page: {
    type: Object as PropType<ResourcesBlogArticle>,
    required: true
  }
})
const authors = computed(() => {
  return (props?.page?.authors || []).map(author => ({ src: author.avatarUrl, ...author }))
})
</script>

<style scoped>
.bg-gradient {
  background-image: url('/assets/resources/blog/bg-gradient.png');
  background-size: cover;
}
.bg-overlay {
  background-image: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 100%);
}
</style>
