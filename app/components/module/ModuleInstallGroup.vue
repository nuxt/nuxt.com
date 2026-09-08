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

const { installCommand, copyInstall, copyPrompt, openCursor, openClaude, openVSCode } = useModuleInstallActions(() => props.module, 'install-group')

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
    },
    {
      label: 'Open in VS Code',
      icon: 'i-simple-icons-visualstudiocode',
      onSelect: openVSCode
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
