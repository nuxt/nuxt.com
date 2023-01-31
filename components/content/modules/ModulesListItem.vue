<template>
  <CardListItem :to="`/modules/${module.name}`" description-class="text-sm line-clamp-2 sm:min-h-[40px] mb-4">
    <template #header>
      <ModulesListItemCover :icon="module.icon" :alt="module.name" />
    </template>
    <template #title>
      <div class="flex items-center gap-1.5">
        <p class="text-lg font-semibold">
          {{ module.name }}
        </p>

        <div v-if="module.type === 'official'" class="flex items-center justify-center rounded-full bg-gradient-to-l from-green-400/30 to-teal-400/30 h-6 w-6">
          <Icon name="uil:medal" class="h-4 w-4 text-gray-900" />
        </div>
      </div>
    </template>
    <template #description>
      {{ module.description }}
    </template>
    <template #footer>
      <div class="flex items-center justify-between gap-3 -mb-2 u-text-gray-500">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5">
            <Icon name="uil:star" class="w-4 h-4" />

            <span class="text-sm">{{ formatNumber(module.stars) }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <Icon name="uil:arrow-to-bottom" class="w-4 h-4" />

            <span class="text-sm">{{ formatNumber(module.downloads) }}</span>
          </div>
        </div>

        <div class="flex items-center gap-1.5">
          <Icon name="uil:users-alt" class="w-4 h-4" />

          <span class="text-sm">{{ module.contributors.length }}</span>
        </div>
      </div>
    </template>
  </CardListItem>
</template>

<script setup lang="ts">
defineProps({
  module: {
    type: Object,
    default: () => null
  }
})
</script>
