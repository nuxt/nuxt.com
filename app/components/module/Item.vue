<script setup lang="ts">
import type { Module } from '~/types'

const props = defineProps<{
  module: Module
  showBadge?: boolean
  linkToDetail?: boolean
  cardSize?: 'small' | 'default' | 'large'
}>()

const { copy } = useClipboard()

const cardTo = computed(() => {
  return props.linkToDetail ? `/modules/${props.module.name}` : undefined
})

const cardClasses = computed(() => {
  const baseClasses = 'flex flex-col overflow-hidden group'

  if (props.cardSize === 'small') {
    return `${baseClasses} h-full`
  }

  return baseClasses
})

const cardUI = computed(() => {
  const base = {
    leading: 'mb-2 bg-transparent',
    container: 'p-4 sm:p-4'
  }

  if (props.cardSize === 'small') {
    return {
      ...base,
      container: 'p-3 sm:p-3'
    }
  }

  return base
})
</script>

<template>
  <UPageCard
    :to="cardTo"
    :title="module.npm"
    :class="cardClasses"
    :ui="cardUI"
  >
    <template #leading>
      <UAvatar
        :src="moduleImage(module.icon)"
        :icon="moduleIcon(module.category)"
        :alt="module.name"
        size="xs"
        class="pointer-events-none rounded-md bg-transparent"
      />
    </template>

    <template #description>
      <span class="line-clamp-2 text-(--ui-text-muted) text-sm">{{ module.description }}</span>
    </template>

    <UBadge
      v-if="showBadge && module.type === 'official'"
      class="space-x-1 shine text-sm items-center justify-center pointer-events-none absolute top-4 right-4"
      size="xs"
      variant="outline"
    >
      <span>Official</span>
    </UBadge>

    <UBadge
      v-if="showBadge && module.sponsor"
      class="space-x-1 shine text-sm items-center justify-center pointer-events-none absolute top-4 right-4"
      size="xs"
    >
      <span>Sponsor</span>
    </UBadge>

    <template #footer>
      <USeparator type="dashed" class="mb-4" />
      <div class="flex items-center justify-between gap-3 -my-1 text-gray-600 dark:text-gray-300">
        <div class="flex items-center gap-3">
          <UTooltip text="Monthly NPM Downloads">
            <NuxtLink
              class="flex items-center gap-1 hover:text-gray-900 hover:dark:text-white"
              :to="`https://npm.chart.dev/${module.npm}`"
              target="_blank"
            >
              <UIcon name="i-ph-arrow-circle-down" class="w-4 h-4 flex-shrink-0" />
              <span class="text-sm font-medium">{{ formatNumber(module.stats.downloads) }}</span>
            </NuxtLink>
          </UTooltip>

          <UTooltip text="GitHub Stars">
            <NuxtLink
              class="flex items-center gap-1 hover:text-gray-900 hover:dark:text-white"
              :to="`https://github.com/${module.repo}`"
              target="_blank"
            >
              <UIcon name="i-ph-star" class="w-4 h-4 flex-shrink-0" />
              <span class="text-sm font-medium">{{ formatNumber(module.stats.stars || 0) }}</span>
            </NuxtLink>
          </UTooltip>
        </div>

        <UTooltip text="Copy install command">
          <UButton
            icon="i-ph-terminal"
            color="neutral"
            size="xs"
            variant="outline"
            @click="copy(`npx nuxi@latest module add ${module.name}`, { title: 'Command copied to clipboard:', description: `npx nuxi@latest module add ${module.name}` })"
          />
        </UTooltip>
      </div>
    </template>
  </UPageCard>
</template>

<style lang="postcss" scoped>
.shine {
  text-decoration: none;
  display: inline-block;
  mask-image: linear-gradient(-75deg, rgba(255,255,255,.8) 30%, #fff 50%, rgba(255,255,255,.8) 70%);
  mask-size: 200%;
  animation: shine 2s linear infinite;
}

@keyframes shine {
  from { -webkit-mask-position: 150%; }
  to { -webkit-mask-position: -50%; }
}
</style>
