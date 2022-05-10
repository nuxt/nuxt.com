<template>
  <NuxtLink :to="page.slug" class="group">
    <div class="relative flex flex-col h-[272px] justify-between p-8 border group rounded-xl u-border-gray-200 overflow-hidden">
      <div class="flex items-center justify-between">
        <UIcon :name="icon" class="w-10 h-10 transition-all u-text-gray-300 group-hover:w-6 group-hover:h-6 group-hover:u-text-gray-900" />
        <UIcon name="heroicons-solid:arrow-right" class="w-4 h-4 transition-opacity opacity-0 group-hover:opacity-100" />
      </div>
      <div class="absolute inset-x-8 bottom-8 transition-transform translate-y-[72px] group-hover:translate-y-0 space-y-1">
        <div class="text-sm font-semibold u-text-gray-400">
          <time>{{ formatDateByLocale('en', page.date) }}</time>
        </div>
        <h2 class="text-2xl font-bold u-text-gray-900 line-clamp-2">
          {{ page.title }}
        </h2>
        <p class="font-medium transition-opacity opacity-0 u-text-gray-500 line-clamp-3 group-hover:opacity-100">
          {{ page.description }}
        </p>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup>
const props = defineProps({
  page: {
    type: Object,
    required: true
  }
})

const icon = computed(() => {
  switch (props.page.type) {
    case 'education':
      return 'heroicons-outline:academic-cap'
    default:
      return 'heroicons-outline:fire'
  }
})

const formatDateByLocale = (locale, d) => {
  return new Date(d).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>
