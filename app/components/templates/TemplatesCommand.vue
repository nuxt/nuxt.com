<script setup lang="ts">
import type { PackageManager, Template, TemplateHealth } from '#shared/types'

const props = defineProps<{
  template: Template
  health?: TemplateHealth
}>()

const { copy, copied } = useClipboard()
const { track } = useAnalytics()

const preferred = useCookie<PackageManager>('nuxt-package-manager', { default: () => 'pnpm', maxAge: 60 * 60 * 24 * 365 })
const pinned = computed(() => templatePackageManager(props.template, props.health))
const packageManager = computed(() => pinned.value || (PACKAGE_MANAGERS.includes(preferred.value) ? preferred.value : 'pnpm'))

const command = computed(() => buildCreateCommand(props.template, packageManager.value))

function copyCommand() {
  if (!command.value) return
  track('Command Copied', { value: command.value })
  copy(command.value)
}
</script>

<template>
  <div class="h-10 min-w-0 flex items-center rounded-md border border-default bg-elevated has-focus-visible:border-primary" :class="copied && 'border-primary'">
    <UTooltip v-if="pinned" :text="`This template uses ${pinned}. Run corepack enable if you don't have it.`">
      <span class="h-full shrink-0 ps-3 pe-3.5 flex items-center gap-2 border-e border-default font-mono text-xs text-muted cursor-default">
        <UIcon :name="PACKAGE_MANAGER_ICONS[pinned]" class="size-4" />
        {{ pinned }}
      </span>
    </UTooltip>
    <div v-else role="radiogroup" aria-label="Package manager" class="h-full shrink-0 px-1 flex items-center gap-0.5 border-e border-default">
      <UTooltip
        v-for="item in PACKAGE_MANAGERS"
        :key="item"
        :text="item === 'pnpm' ? 'pnpm (recommended)' : item"
        :content="{ side: 'top' }"
      >
        <button
          type="button"
          role="radio"
          :aria-checked="packageManager === item"
          :aria-label="item"
          class="size-8 flex items-center justify-center rounded-sm transition focus-visible:outline-2 focus-visible:outline-primary"
          :class="packageManager === item ? 'bg-default ring ring-default shadow-xs' : 'opacity-50 hover:opacity-100 hover:bg-elevated/50'"
          @click="preferred = item"
        >
          <UIcon :name="PACKAGE_MANAGER_ICONS[item]" class="size-4" />
        </button>
      </UTooltip>
    </div>
    <button
      type="button"
      class="h-full flex-1 min-w-0 ps-3 pe-3 flex items-center gap-3 text-left cursor-copy focus-visible:outline-none"
      :aria-label="`Copy ${command}`"
      @click="copyCommand"
    >
      <code class="flex-1 min-w-0 truncate font-mono text-xs text-highlighted"><span class="text-dimmed select-none">$ </span>{{ command }}</code>
      <UIcon :name="copied ? 'i-lucide-check' : 'i-lucide-copy'" class="size-4 shrink-0" :class="copied ? 'text-primary' : 'text-muted'" />
    </button>
  </div>
</template>
