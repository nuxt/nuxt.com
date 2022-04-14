<template>
  <UCard body-class="p-0" class="flex-col space-y-4 cursor-pointer" @click="isOpen = !isOpen">
    <ResourcesLiveEventsModal v-model="isOpen" :video-src="videoSrc" :video-title="videoTitle" />
    <div class="flex h-18 items-center pt-4 px-4">
      <div class="w-10 h-10 flex items-center justify-center flex-shrink-0">
        <img :src="`/resources/live-events/${eventLogo}`" :alt="eventLogo" class="rounded-full u-border-gray-900">
      </div>
      <div class="pl-2 overflow-hidden">
        <h6 class="text-lg font-semibold truncate">
          <Markdown use="title" unwrap="p" />
        </h6>
        <p class="text-sm font-medium u-text-gray-400">
          <Markdown use="name" unwrap="p" />
        </p>
      </div>
    </div>
    <div class="text-gray-700 mb-5 line-clamp-3 h-24 px-4 pt-5">
      <p>
        <Markdown use="description" unwrap="p" />
      </p>
    </div>

    <div class="flex h-18 items-center py-3 px-4 border-t u-bg-gray-100">
      <div class="flex">
        <img :src="avatarSrc" size="lg" class="hexagon w-9 h-10 object-cover">
      </div>
      <div class="flex flex-col pl-3">
        <span class="text-sm font-semibold">
          <Markdown use="speaker" unwrap="p" />
        </span>
        <span class="text-sm">
          {{ formatDateByLocale('en', date) }}
        </span>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
defineProps({
  eventLogo: {
    type: String,
    default: ''
  },
  avatarSrc: {
    type: String,
    default: ''
  },
  date: {
    type: String,
    default: ''
  },
  videoSrc: {
    type: String,
    default: ''
  },
  videoTitle: {
    type: String,
    default: ''
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
