<script setup lang="ts">
import type { BlogPost } from '~/composables/useBlog'

const props = defineProps<{
  post: BlogPost
  eager?: boolean
}>()

const meta = computed(() => [
  props.post.category,
  formatShortDate(props.post.date),
  props.post.readingTime && `${props.post.readingTime} min read`
].filter(Boolean).join(' · '))
</script>

<template>
  <UBlogPost
    :to="post.path"
    :title="post.title"
    :description="post.description"
    :date="post.date"
    :image="post.image ? { src: post.image, alt: `${post.title} cover`, width: 960, height: 540, loading: eager ? 'eager' : 'lazy' } : undefined"
    variant="naked"
    :ui="{
      header: 'shadow-none',
      body: 'p-0 sm:p-0 pt-4 sm:pt-4',
      meta: 'mb-1.5',
      date: 'text-muted',
      title: 'text-lg',
      description: 'line-clamp-2'
    }"
  >
    <template #date>
      {{ meta }}
    </template>
  </UBlogPost>
</template>
