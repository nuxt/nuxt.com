<script setup lang="ts">
const props = defineProps<{
  name: string
  slug: string
  description?: string
  repo?: string
  demo?: string
  badge?: string
  purchase?: string
}>()

const { copy } = useClipboard()
const { track } = useAnalytics()

const initCommand = computed(() => {
  if (!props.repo) return null
  return `npx nuxi init -t gh:${props.repo} my-app`
})

function copyInit() {
  if (!initCommand.value) return
  track('Template Init Copied', { template: props.slug, source: 'nuxt-agent' })
  copy(initCommand.value, { title: 'Command copied to clipboard:', description: initCommand.value })
}
</script>

<template>
  <div class="@container flex flex-col rounded-lg border border-default bg-elevated/50 overflow-hidden">
    <NuxtLink :to="`/templates`" class="block hover:bg-elevated transition-colors overflow-hidden">
      <NuxtImg
        :src="`/assets/templates/${slug}.webp`"
        :alt="name"
        class="w-full aspect-2/1 object-cover object-top"
        width="384"
        height="192"
        format="webp"
        loading="lazy"
      />
    </NuxtLink>

    <div class="px-3 py-2">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold text-highlighted truncate">{{ name }}</span>
        <UBadge
          v-if="badge === 'Premium'"
          label="Premium"
          color="info"
          variant="subtle"
          size="sm"
          class="rounded-full"
        />
        <UBadge
          v-else-if="badge === 'Freemium'"
          label="Freemium"
          color="success"
          variant="subtle"
          size="sm"
          class="rounded-full"
        />
      </div>
      <p v-if="description" class="text-xs text-muted line-clamp-2 mt-0.5">
        {{ description }}
      </p>
    </div>

    <div class="flex items-center gap-1.5 px-3 py-1.5 border-t border-default">
      <div class="flex items-center gap-1 @xs:gap-2.5 flex-1">
        <NuxtLink v-if="demo" :to="demo" target="_blank" aria-label="Open demo" class="flex items-center gap-1 text-muted hover:text-default transition-colors">
          <UIcon name="i-lucide-laptop" class="size-3.5" />
          <span class="hidden @xs:inline text-[11px]">Demo</span>
        </NuxtLink>
        <NuxtLink v-if="repo" :to="`https://github.com/${repo}`" target="_blank" aria-label="Open on GitHub" class="flex items-center gap-1 text-muted hover:text-default transition-colors">
          <UIcon name="i-simple-icons-github" class="size-3.5" />
          <span class="hidden @xs:inline text-[11px]">GitHub</span>
        </NuxtLink>
        <NuxtLink v-if="purchase" :to="purchase" target="_blank" aria-label="Purchase" class="flex items-center gap-1 text-muted hover:text-default transition-colors">
          <UIcon name="i-lucide-credit-card" class="size-3.5" />
          <span class="hidden @xs:inline text-[11px]">Purchase</span>
        </NuxtLink>
      </div>

      <UButton
        v-if="initCommand"
        icon="i-lucide-terminal"
        label="Init"
        size="xs"
        color="primary"
        variant="soft"
        @click.stop="copyInit"
      />
    </div>
  </div>
</template>
