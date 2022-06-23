<template>
  <div class="not-prose">
    <div class="pb-20 pt-36 md:pt-44 lg:pt-28">
      <img src="/assets/home/hero-gradient.svg" class="absolute top-0 right-0 overflow-hidden select-none">
      <UContainer padded class="relative flex flex-col justify-start gap-y-8">
        <div v-if="$slots.badgeLabel" class="flex gap-x-2">
          <UBadge rounded variant="green">
            <Markdown :use="$slots.badgeLabel" unwrap="p" />
          </UBadge>
          <span class="u-text-gray-800">
            <Markdown :use="$slots.news" unwrap="p" />
          </span>
        </div>
        <h1 v-if="$slots.title" class="max-w-2xl text-5xl font-semibold text-left md:text-6xl lg:text-7xl u-text-gray-900">
          <Markdown use="title" unwrap="p" />
        </h1>
        <p v-if="$slots.description" class="w-3/5 max-w-lg text-lg text-left u-text-gray-800">
          <Markdown use="description" unwrap="p" />
        </p>
        <div class="flex gap-y-4 gap-x-4 sm:gap-x-8">
          <UButton label="watch video" size="lg" variant="primary-gradient" @click="scrollToVideo()" />
          <UButton
            v-for="button of buttons"
            :key="button.label"
            size="lg"
            :variant="button.variant || 'transparent'"
            :icon="button.icon || undefined"
            :label="button.label || ''"
            :to="button.to || '#'"
            :trailing="button.trailing"
          />
        </div>
        <HomeGemWrapper>
          <HomeGem />
        </HomeGemWrapper>
      </UContainer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue'

const route = useRoute()
const router = useRouter()

defineProps({
  buttons: {
    type: Array as PropType<{ label?: string, variant?: string, to?: string, icon?: string, trailing?: boolean }[]>,
    default: () => []
  }
})

const scrollToVideo = () => {
  router.push({
    name: 'index',
    query: {
      ...route.query
    },
    params: {
      smooth: '#smooth'
    }
  })
}
</script>
