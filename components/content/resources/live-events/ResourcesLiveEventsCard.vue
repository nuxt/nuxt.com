<template>
  <UCard
    padded
    body-class=""
    shadow-class=""
    class="space-y-4 transition duration-200 cursor-pointer group hover:ring-2 hover:u-ring-gray-900"
    @click="isOpen = !isOpen"
  >
    <ResourcesLiveEventsModal v-model="isOpen" :page="page" />

    <div class="relative flex items-center px-4 pt-4 h-18">
      <div class="flex items-center justify-center flex-shrink-0 w-10 h-10">
        <img :src="`/resources/live-events/${page.eventLogo}`" :alt="page.eventLogo" class="rounded-full u-border-gray-900">
      </div>
      <div class="flex-grow pl-2 overflow-hidden">
        <h6 class="text-lg font-semibold truncate">
          {{ page.title }}
        </h6>
        <p class="text-sm font-medium u-text-gray-400">
          {{ page.name }}
        </p>
      </div>
      <div class="flex items-end self-start pl-4 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
        <UIcon name="uil:arrow-resize-diagonal" class="w-4 h-4" />
      </div>
    </div>
    <div class="h-24 px-4 pt-5 mb-5 u-text-gray-700 line-clamp-3">
      <p>
        {{ page.description }}
      </p>
    </div>

    <div class="flex items-center px-4 py-3 border-t u-border-gray-200 h-18 u-bg-gray-100">
      <div class="flex">
        <img :src="page.avatarSrc" size="lg" class="object-cover h-10 hexagon w-9">
      </div>
      <div class="flex flex-col pl-3">
        <span class="text-sm font-semibold u-text-gray-900">
          {{ page.speaker }}
        </span>
        <span class="text-sm u-text-gray-400">
          {{ formatDateByLocale('en', page.date) }}
        </span>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
defineProps({
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
