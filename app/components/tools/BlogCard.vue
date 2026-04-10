<script setup lang="ts">
const props = defineProps<{
  title: string
  description?: string
  path: string
  date?: string
  image?: string
  category?: string
  authors?: Array<{ name: string, avatar?: string }>
}>()

const formattedDate = computed(() => {
  if (!props.date) return null
  return formatDateByLocale('en', props.date)
})
</script>

<template>
  <NuxtLink :to="path" class="flex flex-col rounded-lg border border-default bg-elevated/50 overflow-hidden hover:bg-elevated transition-colors max-w-sm">
    <NuxtImg
      v-if="image"
      :src="image"
      :alt="title"
      class="w-full aspect-2/1 object-cover"
      width="384"
      height="192"
      loading="lazy"
    />

    <div class="px-3 py-2">
      <div class="flex items-center gap-2 mb-0.5">
        <UBadge
          v-if="category"
          :label="category"
          :color="category === 'Release' ? 'primary' : category === 'Tutorial' ? 'info' : 'neutral'"
          variant="subtle"
          size="sm"
          class="rounded-full"
        />
        <span v-if="formattedDate" class="text-[11px] text-dimmed">{{ formattedDate }}</span>
      </div>
      <span class="text-sm font-semibold text-highlighted line-clamp-2">{{ title }}</span>
      <p v-if="description" class="text-xs text-muted line-clamp-2 mt-0.5">
        {{ description }}
      </p>
    </div>

    <div v-if="authors?.length" class="flex items-center gap-2 px-3 py-1.5 border-t border-default">
      <div class="flex -space-x-1">
        <UAvatar
          v-for="author in authors.slice(0, 3)"
          :key="author.name"
          :src="author.avatar"
          :alt="author.name"
          size="2xs"
          class="ring-1 ring-default"
        />
      </div>
      <span class="text-[11px] text-muted">{{ authors.map(a => a.name).join(', ') }}</span>
    </div>
  </NuxtLink>
</template>
