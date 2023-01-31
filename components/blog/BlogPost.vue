<template>
  <CardListItem
    :to="page._path"
    class="group h-full"
    header-class="flex"
    body-class="flex flex-col h-full"
    title-class="text-2xl"
    wrapper-content-class="p-4"
    :truncate="false"
  >
    <template #header>
      <div class="w-full">
        <img :src="page.imgUrl" class="object-cover w-full h-[150px]">
        <UBadge class="mt-4 ml-4" rounded>
          {{ page.category }}
        </UBadge>
      </div>
    </template>
    <template #title>
      {{ page.title }}
    </template>
    <template #footer>
      <div class="text-sm font-semibold u-text-gray-400 p-4 h-full flex justify-between items-center card-footer">
        <time class="pb-1">{{ formatDateByLocale('en', page.date) }}</time>
        <UAvatarGroup :group="page?.authors?.map(author => ({ src: author.avatarUrl, ...author }))" size="sm" />
      </div>
    </template>
  </CardListItem>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { formatDateByLocale } from '../../utils'
import type { ResourcesBlogArticle } from '../../types'
defineProps({
  page: {
    type: Object as PropType<ResourcesBlogArticle>,
    required: true
  }
})
</script>

<style scoped>
.card-footer {
  align-items: self-end;
}
</style>
