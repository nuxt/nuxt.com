<template>
  <CardListItem
    :to="page._path"
    class="group h-full app-card-blog"
    title-class="text-2xl"
    wrapper-content-class="p-4 grow h-full flex items-center"
    :truncate="false"
    :header-padding="false"
    :body-padding="false"
    :footer-padding="false"

  >
    <template #header>
      <div class="w-full">
        <img :src="page.image" class="object-cover w-full h-[150px]">
        <AppBadge class="mt-4 ml-4" rounded>
          {{ page.category }}
        </AppBadge>
      </div>
    </template>
    <template #title>
      {{ page.title }}
    </template>
    <template #footer>
      <div class="text-sm font-semibold u-text-gray-400 h-full py-2 p-4 flex justify-between items-end w-full">
        <time class="pb-1">{{ formatDateByLocale('en', page.date) }}</time>
        <AppAvatarGroup :group="page?.authors?.map(author => ({ src: author.avatarUrl, ...author }))" size="sm" />
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

<style lang="ts">
css({
  '.app-card-blog': {
    height: '{size.full}',
    display: 'flex !important',
    flexDirection: 'column',
    justifyContent: 'space-between',

    padding: '0px',

    '> .header': {
      padding: '0px',

      '@sm': {
        padding: '0px',
      }
    },
  }
})
</style>
