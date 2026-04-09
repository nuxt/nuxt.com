<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  path: string
  logoSrc?: string
  logoIcon?: string
  category?: string
  nitroPreset?: string
  website?: string
}>()
</script>

<template>
  <div class="flex flex-col rounded-lg border border-default bg-elevated/50 overflow-hidden">
    <NuxtLink :to="path" class="flex items-start gap-3 p-3 hover:bg-elevated transition-colors">
      <UAvatar
        v-if="logoSrc"
        :src="logoSrc"
        :alt="title"
        size="md"
        class="rounded-md bg-transparent shrink-0"
      />
      <div v-else class="flex items-center justify-center size-10 rounded-md bg-elevated shrink-0">
        <UIcon :name="logoIcon || 'i-lucide-server'" class="size-5 text-muted" />
      </div>
      <div class="min-w-0 flex-1">
        <span class="text-sm font-semibold text-highlighted truncate">{{ title }}</span>
        <p v-if="description" class="text-xs text-muted line-clamp-2 mt-0.5">
          {{ description }}
        </p>
      </div>
    </NuxtLink>

    <div class="flex items-center gap-2 px-3 py-1.5 border-t border-default">
      <div class="flex items-center gap-2.5 text-[11px] text-muted flex-1">
        <span v-if="category" class="flex items-center gap-1">
          <UIcon name="i-lucide-layers" class="size-3" />
          {{ category }}
        </span>
        <NuxtLink v-if="website" :to="website" target="_blank" class="flex items-center gap-1 hover:text-default transition-colors">
          <UIcon name="i-lucide-globe" class="size-3" />
          Website
        </NuxtLink>
        <NuxtLink v-if="nitroPreset" :to="`https://nitro.unjs.io/deploy/providers/${nitroPreset}`" target="_blank" class="flex items-center gap-1 hover:text-default transition-colors">
          <UIcon name="i-lucide-book" class="size-3" />
          Nitro Docs
        </NuxtLink>
      </div>

      <UButton
        icon="i-lucide-arrow-right"
        label="Guide"
        size="xs"
        color="primary"
        variant="soft"
        :to="path"
      />
    </div>
  </div>
</template>
