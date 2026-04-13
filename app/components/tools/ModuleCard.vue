<script setup lang="ts">
const props = defineProps<{
  name: string
  npm?: string
  description?: string
  icon?: string
  category?: string
  repo?: string
  website?: string
  downloads?: number
  stars?: number
}>()

const { copy } = useClipboard()
const { track } = useAnalytics()

const installCommand = computed(() => `npx nuxt@latest module add ${props.name}`)

const agentPrompt = computed(() => {
  const lines = [`Install and configure the Nuxt module **${props.npm || props.name}**: ${props.description || ''}`]
  if (props.website) lines.push(`Docs: ${props.website}`)
  if (props.repo) lines.push(`GitHub: https://github.com/${props.repo}`)
  lines.push(`\nSteps:\n1. Run \`${installCommand.value}\`\n2. Read the module documentation and add recommended configuration in \`nuxt.config.ts\`\n3. List any required environment variables in \`.env.example\` without filling in actual values`)
  return lines.join('\n')
})

function copyInstall() {
  track('Module Install Command Copied', { module: props.name, source: 'nuxt-agent' })
  copy(installCommand.value, { title: 'Command copied to clipboard:', description: installCommand.value })
}

function copyPrompt() {
  track('Module Agent Prompt Copied', { module: props.name, source: 'nuxt-agent' })
  copy(agentPrompt.value, { title: 'Agent prompt copied!', description: props.npm || props.name, icon: 'i-custom-ai' })
}
</script>

<template>
  <div class="flex flex-col rounded-lg border border-default bg-elevated/50 overflow-hidden">
    <NuxtLink :to="`/modules/${name}`" class="flex items-start gap-3 p-3 hover:bg-elevated transition-colors">
      <UAvatar
        :src="moduleImage(icon)"
        :icon="moduleIcon(category || '')"
        :alt="name"
        size="md"
        class="rounded-md bg-transparent shrink-0"
      />
      <div class="min-w-0 flex-1">
        <span class="text-sm font-semibold text-highlighted truncate">{{ npm || name }}</span>
        <p v-if="description" class="text-xs text-muted line-clamp-2 mt-0.5">
          {{ description }}
        </p>
      </div>
    </NuxtLink>

    <div class="flex items-center gap-2 px-3 py-1.5 border-t border-default">
      <div class="flex items-center gap-2.5 text-[11px] text-muted flex-1">
        <span v-if="stars" class="flex items-center gap-1">
          <UIcon name="i-lucide-star" class="size-3" />
          {{ formatNumber(stars) }}
        </span>
        <NuxtLink v-if="website" :to="website" target="_blank" class="flex items-center gap-1 hover:text-default transition-colors">
          <UIcon name="i-lucide-book" class="size-3" />
          Docs
        </NuxtLink>
        <NuxtLink v-if="repo" :to="`https://github.com/${repo}`" target="_blank" class="flex items-center gap-1 hover:text-default transition-colors">
          <UIcon name="i-lucide-github" class="size-3" />
          GitHub
        </NuxtLink>
      </div>

      <UButton
        icon="i-custom-ai"
        label="Prompt"
        size="xs"
        color="neutral"
        variant="outline"
        @click.stop="copyPrompt"
      />
      <UButton
        icon="i-lucide-terminal"
        label="Install"
        size="xs"
        color="primary"
        variant="soft"
        @click.stop="copyInstall"
      />
    </div>
  </div>
</template>
