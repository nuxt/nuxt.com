<script setup lang="ts">
import type { Module } from '~/types'

const { module, showBadge = true } = defineProps<{
  module: Module
  showBadge?: boolean
}>()

const { copy } = useClipboard()
const { selectedSort } = useModules()

function copyInstallCommand(moduleName: string) {
  const command = `npx nuxi@latest module add ${moduleName}`
  copy(command, { title: 'Command copied to clipboard:', description: command })
}
</script>

<template>
  <UPageCard
    :to="`/modules/${module.name}`"
    :title="module.npm"
    :description="module.description"
    class="group"
    variant="subtle"
    :ui="{
      description: 'line-clamp-2 text-(--ui-text-muted) text-sm',
      container: 'flex flex-col',
      wrapper: 'flex flex-col min-h-0 items-start',
      body: 'flex-none',
      footer: 'w-full mt-auto pointer-events-auto pt-4 z-[1]'
    }"
  >
    <template #leading>
      <UAvatar
        :src="moduleImage(module.icon)"
        :icon="moduleIcon(module.category)"
        :alt="module.name"
        size="md"
        class="rounded-md bg-transparent"
      />
    </template>

    <UBadge
      v-if="showBadge && module.type === 'official'"
      class="shine absolute top-4 right-4 sm:top-6 sm:right-6"
      variant="subtle"
      color="primary"
      label="Official"
    />

    <UBadge
      v-if="showBadge && module.sponsor"
      class="shine absolute top-4 right-4 sm:top-6 sm:right-6"
      variant="subtle"
      color="important"
      label="Sponsor"
    />

    <template #footer>
      <USeparator type="dashed" class="mb-4" />

      <div class="flex items-center justify-between gap-3 -my-1 text-(--ui-text-muted)">
        <div class="flex items-center gap-3">
          <UTooltip text="Monthly NPM Downloads">
            <NuxtLink
              class="flex items-center gap-1 hover:text-(--ui-text-highlighted)"
              :to="`https://npm.chart.dev/${module.npm}`"
              target="_blank"
            >
              <UIcon name="i-lucide-circle-arrow-down" class="size-4 shrink-0" />
              <span class="text-sm font-medium">{{ formatNumber(module.stats.downloads) }}</span>
            </NuxtLink>
          </UTooltip>

          <UTooltip text="GitHub Stars">
            <NuxtLink
              class="flex items-center gap-1 hover:text-(--ui-text-highlighted)"
              :to="`https://github.com/${module.repo}`"
              target="_blank"
            >
              <UIcon name="i-lucide-star" class="size-4 shrink-0" />
              <span class="text-sm font-medium">{{ formatNumber(module.stats.stars || 0) }}</span>
            </NuxtLink>
          </UTooltip>

          <UTooltip v-if="selectedSort.key === 'publishedAt'" text="Updated Date">
            <NuxtLink
              class="flex items-center gap-1 hover:text-(--ui-text-highlighted)"
              :to="`https://github.com/${module.repo}`"
              target="_blank"
            >
              <UIcon name="i-lucide-calendar-days" class="size-4 shrink-0" />
              <span class="text-sm font-medium">{{ formatDateByLocale('en', module.stats.publishedAt) }}</span>
            </NuxtLink>
          </UTooltip>

          <UTooltip v-if="selectedSort.key === 'createdAt'" text="Created Date">
            <NuxtLink
              class="flex items-center gap-1 hover:text-(--ui-text-highlighted)"
              :to="`https://github.com/${module.repo}`"
              target="_blank"
            >
              <UIcon name="i-lucide-calendar-days" class="size-4 shrink-0" />
              <span class="text-sm font-medium">{{ formatDateByLocale('en', module.stats.createdAt) }}</span>
            </NuxtLink>
          </UTooltip>
        </div>

        <UTooltip text="Copy install command">
          <UButton
            icon="i-lucide-terminal"
            color="neutral"
            size="xs"
            variant="outline"
            @click="copyInstallCommand(module.name)"
          >
            <span class="sr-only">Copy command to install {{ module.name }}</span>
          </UButton>
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
