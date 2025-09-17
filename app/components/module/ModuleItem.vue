<script setup lang="ts">
import type { Module } from '~/types'

const emit = defineEmits<{
  add: [module: Module]
  remove: [module: Module]
}>()

const { module, showBadge = true, isAdded, showAddButton = true } = defineProps<{
  module: Module
  showBadge?: boolean
  isAdded: boolean
  showAddButton?: boolean
}>()

const { copy } = useClipboard()
const { selectedSort } = useModules()
const date = computed(() => {
  if (selectedSort.value.key === 'publishedAt') {
    return useTimeAgo(module.stats.publishedAt)
  }

  return useTimeAgo(module.stats.createdAt)
})

function copyInstallCommand(moduleName: string) {
  const command = `npx nuxt@latest module add ${moduleName}`
  copy(command, { title: 'Command copied to clipboard:', description: command })
}

function toggleModule(module: Module) {
  if (isAdded) {
    emit('remove', module)
  } else {
    emit('add', module)
  }
}

function handleCardClick(event: MouseEvent) {
  if (event.shiftKey) {
    event.preventDefault()
    toggleModule(module)
  }
}

const items = computed(() => [
  [
    {
      label: isAdded ? 'Remove module' : 'Add module',
      icon: isAdded ? 'i-lucide-minus' : 'i-lucide-plus',
      onSelect: () => toggleModule(module)
    },
    {
      label: 'Copy install command',
      icon: 'i-lucide-terminal',
      onSelect: () => copyInstallCommand(module.name)
    }
  ],
  [
    {
      icon: 'i-lucide-book',
      label: 'Documentation',
      to: `${module.website}?utm_source=nuxt.com&utm_medium=aside-module&utm_campaign=nuxt.com`,
      target: '_blank'
    },
    {
      label: 'View on GitHub',
      icon: 'i-lucide-github',
      to: `https://github.com/${module.repo}`,
      target: '_blank'
    },
    {
      label: 'View on npm',
      icon: 'i-lucide-package',
      to: `https://npm.chart.dev/${module.npm}`,
      target: '_blank'
    }
  ]
])
</script>

<template>
  <UContextMenu :items="items">
    <UPageCard
      :to="`/modules/${module.name}`"
      :title="module.npm"
      :description="module.description"
      class="group"
      variant="subtle"
      :ui="{
        root: isAdded ? 'ring-primary hover:ring-primary' : '',
        description: 'line-clamp-2 text-muted text-sm',
        container: 'flex flex-col',
        wrapper: 'flex flex-col min-h-0 items-start',
        body: 'flex-none',
        footer: 'w-full mt-auto pointer-events-auto pt-4 z-[1]'
      }"
      @click="handleCardClick"
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

        <div class="flex items-center justify-between gap-3 -my-1 text-muted">
          <div class="flex items-center gap-3 flex-wrap">
            <UTooltip text="Monthly NPM Downloads">
              <NuxtLink
                class="flex items-center gap-1 hover:text-highlighted"
                :to="`https://npm.chart.dev/${module.npm}`"
                target="_blank"
              >
                <UIcon name="i-lucide-circle-arrow-down" class="size-4 shrink-0" />
                <span class="text-sm font-medium whitespace-normal">{{ formatNumber(module.stats.downloads) }}</span>
              </NuxtLink>
            </UTooltip>

            <UTooltip text="GitHub Stars">
              <NuxtLink
                class="flex items-center gap-1 hover:text-highlighted"
                :to="`https://github.com/${module.repo}`"
                target="_blank"
              >
                <UIcon name="i-lucide-star" class="size-4 shrink-0" />
                <span class="text-sm font-medium whitespace-normal">{{ formatNumber(module.stats.stars || 0) }}</span>
              </NuxtLink>
            </UTooltip>

            <UTooltip v-if="selectedSort.key === 'publishedAt'" :text="`Updated ${formatDateByLocale('en', module.stats.publishedAt)}`">
              <NuxtLink
                class="flex items-center gap-1 hover:text-highlighted"
                :to="`https://github.com/${module.repo}`"
                target="_blank"
              >
                <UIcon name="i-lucide-radio" class="size-4 shrink-0" />
                <span class="text-sm font-medium whitespace-normal">{{ date }}</span>
              </NuxtLink>
            </UTooltip>

            <UTooltip v-if="selectedSort.key === 'createdAt'" :text="`Created ${formatDateByLocale('en', module.stats.createdAt)}`">
              <NuxtLink
                class="flex items-center gap-1 hover:text-highlighted"
                :to="`https://github.com/${module.repo}`"
                target="_blank"
              >
                <UIcon name="i-lucide-package" class="size-4 shrink-0" />
                <span class="text-sm font-medium whitespace-normal">{{ date }}</span>
              </NuxtLink>
            </UTooltip>
          </div>

          <div class="flex items-center gap-2">
            <UTooltip v-if="showAddButton" :text="isAdded ? 'Remove module' : 'Add module'">
              <UButton
                :icon="isAdded ? 'i-lucide-check' : 'i-lucide-plus'"
                color="neutral"
                size="xs"
                variant="outline"
                @click="toggleModule(module)"
              >
                <span class="sr-only">{{ isAdded ? 'Remove module' : 'Add module' }}</span>
              </UButton>
            </UTooltip>
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
        </div>
      </template>
    </UPageCard>
  </UContextMenu>
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
