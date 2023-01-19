<script setup lang="ts">
import type { PropType } from 'vue'
import type { ResourcesBlogArticleAuthor } from 'types'

defineProps({
  authors: {
    type: Array as PropType<Array<ResourcesBlogArticleAuthor>>,
    default: () => []
  },
  date: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <Page>
    <div class="relative flex flex-col justify-center gap-y-4 sm:gap-y-5 sm:h-72">
      <h1 class="text-4xl font-semibold sm:text-5xl u-text-gray-900">
        <ContentSlot :use="$slots.title" unwrap="p" />
      </h1>
      <p class="font-medium sm:text-lg text-gray-500">
        <ContentSlot :use="$slots.description" unwrap="p" />
      </p>
      <div class="flex mb-6 items-center gap-x-2">
        <time class="mr-2 text-sm font-medium">
          {{ date }}
        </time>
        <div v-for="author in authors" :key="author.name">
          <NuxtLink :to="author.link" target="_blank" class="block flex items-center justify-end -ml-2 sm:ml-0 sm:mr-2">
            <UAvatar
              rounded
              :src="author.avatarUrl"
            />
            <span class="font-semibold u-text-gray-900 pl-2">
              {{ author.name }}
            </span>
          </NuxtLink>
        </div>
      </div>
    </div>
    <ContentSlot :use="$slots.body" />
  </Page>
</template>
