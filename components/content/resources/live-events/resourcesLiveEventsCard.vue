<template>
  <UCard
    body-class="p-0"
    class="flex-col space-y-4 cursor-pointer"
    custom-class="transition ease-in-out duration-300 hover:ring-1 hover:u-ring-gray-700 group"
    @click="isOpen = !isOpen"
  >
    <ResourcesLiveEventsModal v-model="isOpen" :page="page" />

    <div class="flex h-18 items-center pt-4 px-4 relative">
      <div class="w-10 h-10 flex items-center justify-center flex-shrink-0">
        <img :src="`/resources/live-events/${page.eventLogo}`" :alt="page.eventLogo" class="rounded-full u-border-gray-900">
      </div>
      <div class="pl-2 flex-grow overflow-hidden">
        <h6 class="text-lg font-semibold truncate">
          {{ page.title }}
        </h6>
        <p class="text-sm font-medium u-text-gray-400">
          {{ page.name }}
        </p>
      </div>
      <div class="flex items-end self-start pl-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <UIcon name="heroicons-outline:arrows-expand" class="w-5 h-5" />
      </div>
    </div>
    <div class="text-gray-700 mb-5 line-clamp-3 h-24 px-4 pt-5">
      <p>
        {{ page.description }}
      </p>
    </div>

    <div class="flex h-18 items-center py-3 px-4 border-t u-bg-gray-100">
      <div class="flex">
        <img :src="page.avatarSrc" size="lg" class="hexagon w-9 h-10 object-cover">
      </div>
      <div class="flex flex-col pl-3">
        <span class="text-sm font-semibold">
          {{ page.speaker }}
        </span>
        <span class="text-sm">
          {{ formatDateByLocale('en', page.date) }}
        </span>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
const props = defineProps({
  page: {
    type: Object,
    default: () => {}
  }
})

const isOpen = ref(false)

const formatDateByLocale = (locale, d) => {
  return new Date(d).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
.hexagon {
  -webkit-clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}
</style>
