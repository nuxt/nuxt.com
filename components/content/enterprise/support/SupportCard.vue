<template>
  <AppCard class="flex flex-col gap-y-4">
    <div class="flex justify-between items-center pb-4">
      <img :src="image.path" :width="image.width" :height="image.height" :alt="image.alt">
      <div v-if="badge" class="py-[6px] px-3 border border-gray-200 bg-white dark:border-white/5 dark:bg-white/10 rounded-full self-start flex items-center justify-center">
        <span v-if="badge.partner" class="text-gray-900 dark:text-white text-xs">{{ badge.label }}</span>
        <div v-else>
          <img class="hidden dark:block" src="/assets/enterprise/support/nuxtlabs-dark.svg" width="48" height="12">
          <img class="dark:hidden" src="/assets/enterprise/support/nuxtlabs-white.svg" width="48" height="12">
        </div>
      </div>
    </div>
    <div class="flex flex-col text-gray-900 dark:text-white gap-y-4">
      <h4 class="font-semibold text-2xl">
        <ContentSlot :use="$slots.title" unwrap="p" />
      </h4>
      <p>
        <ContentSlot :use="$slots.description" unwrap="p" />
      </p>
      <ul class="flex flex-col gap-y-2 jsutify-center items-start">
        <li v-for="item in list" :key="item" class="flex gap-x-2 item-center justify-center">
          <div class="w-4 h-4 flex shrink-0">
            <Icon name="heroicons-solid:check-circle" size="16px" class="text-green-400 mt-[5.5px] w-4 h-4" />
          </div>
          <span>{{ item }}</span>
        </li>
      </ul>
      <div v-if="cta" class="pt-2">
        <AppButton
          :variant="cta.variant || 'transparent'"
          :icon="cta.icon || undefined"
          :label="cta.label || ''"
          :to="cta.to || undefined"
          :trailing="cta.trailing"
          :size="cta.size || 'lg'"
          class="focus-visible:ring-2 w-fit"
          :download="false"
          :target="cta.target || '_self'"
        />
      </div>
    </div>
  </AppCard>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { Image } from 'types'

defineProps({
  image: {
    type: Object as PropType<Image>,
    default: () => ({})
  },
  badge: {
    type: Object as PropType<{ partner: boolean, label?: string }>,
    default: null
  },
  list: {
    type: Array as PropType<Array<string>>,
    default: () => []
  },
  cta: {
    type: Object,
    default: null
  }
})
</script>
