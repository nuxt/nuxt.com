<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Module } from '#shared/types'

const props = withDefaults(
  defineProps<{
    module: Pick<Module, 'name' | 'npm' | 'description' | 'website' | 'repo'>
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    label?: string
  }>(),
  {
    size: 'md',
    label: 'Install this module'
  }
)

const { copy } = useClipboard()
const { track } = useAnalytics()
const { openInCursor, openInClaudeCode } = useIdeDeeplink()

const installCommand = computed(() => buildModuleInstallCommand(props.module.name))
const agentPrompt = computed(() => buildModuleAgentPrompt(props.module))

function copyInstall() {
  track('Module Install Command Copied', { module: props.module.name, source: 'install-group' })
  copy(installCommand.value, { title: 'Command copied to clipboard:', description: installCommand.value })
}

function copyPrompt() {
  track('Module Agent Prompt Copied', { module: props.module.name, source: 'install-group' })
  copy(agentPrompt.value, {
    title: 'Agent prompt copied!',
    description: props.module.npm || props.module.name,
    icon: 'i-custom-ai'
  })
}

async function openCursor() {
  track('Module Prompt Opened', { module: props.module.name, ide: 'cursor', source: 'install-group' })
  await openInCursor(agentPrompt.value)
}

async function openClaude() {
  track('Module Prompt Opened', { module: props.module.name, ide: 'claude', source: 'install-group' })
  await openInClaudeCode(agentPrompt.value)
}

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: 'Copy install command',
      icon: 'i-lucide-terminal',
      onSelect: copyInstall
    },
    {
      label: 'Copy agent prompt',
      icon: 'i-custom-ai',
      onSelect: copyPrompt
    }
  ],
  [
    {
      label: 'Open in Cursor',
      icon: 'i-simple-icons-cursor',
      onSelect: openCursor
    },
    {
      label: 'Open in Claude Code',
      icon: 'i-simple-icons-anthropic',
      onSelect: openClaude
    }
  ]
])
</script>

<template>
  <UFieldGroup :size="size">
    <UTooltip :text="`Copy: ${installCommand}`" class="grow">
      <UButton
        color="neutral"
        variant="solid"
        icon="i-lucide-terminal"
        :label="label"
        block
        @click="copyInstall"
      />
    </UTooltip>

    <UDropdownMenu :items="items" :content="{ align: 'end' }">
      <UButton
        color="neutral"
        variant="solid"
        icon="i-lucide-chevron-down"
        aria-label="More install options"
        class="shrink-0"
      />
    </UDropdownMenu>
  </UFieldGroup>
</template>
