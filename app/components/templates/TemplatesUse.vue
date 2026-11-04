<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Template, TemplateHealth } from '#shared/types'

const props = defineProps<{
  template: Template
  health?: TemplateHealth
}>()

const { track } = useAnalytics()

const deployItems = computed<DropdownMenuItem[][]>(() => {
  const providers = DEPLOY_PROVIDERS.flatMap((provider) => {
    const url = buildDeployUrl(props.template, provider.value)
    return url
      ? [{
          label: provider.label,
          icon: provider.icon,
          to: url,
          target: '_blank',
          onSelect: () => track('Template Action', { template: props.template.name, action: `Deploy ${provider.label}` })
        }]
      : []
  })
  return providers.length ? [providers, [{ label: 'Other Providers', icon: 'i-lucide-server', to: '/deploy', onSelect: () => track('Template Action', { template: props.template.name, action: 'Deploy Other' }) }]] : []
})
const editors = computed<DropdownMenuItem[]>(() => {
  const stackBlitz = isStarter(props.template) ? `/new/s/${props.template.slug}` : buildStackBlitzUrl(props.template)
  const codeSandbox = isStarter(props.template) ? `/new/c/${props.template.slug}` : buildCodeSandboxUrl(props.template)
  return [
    stackBlitz && { label: 'Open in StackBlitz', icon: 'i-simple-icons-stackblitz', to: stackBlitz, target: '_blank', onSelect: () => track('Template Action', { template: props.template.name, action: 'Open StackBlitz' }) },
    codeSandbox && { label: 'Open in CodeSandbox', icon: 'i-simple-icons-codesandbox', to: codeSandbox, target: '_blank', onSelect: () => track('Template Action', { template: props.template.name, action: 'Open CodeSandbox' }) }
  ].filter(item => !!item)
})
</script>

<template>
  <div v-if="isScaffoldable(template)" class="flex flex-col gap-2">
    <div class="flex flex-col sm:flex-row gap-2">
      <TemplatesCommand :template="template" :health="health" class="flex-1" />
      <div class="flex gap-2">
        <UDropdownMenu v-if="deployItems.length" :items="deployItems" :content="{ align: 'end' }">
          <UButton
            label="Deploy"
            icon="i-lucide-rocket"
            trailing-icon="i-lucide-chevron-down"
            color="neutral"
            variant="subtle"
            class="h-10 flex-1 sm:flex-none justify-center ring-default"
          />
        </UDropdownMenu>
        <UDropdownMenu v-if="editors.length" :items="editors" :content="{ align: 'end' }">
          <UButton
            icon="i-lucide-ellipsis"
            color="neutral"
            variant="subtle"
            class="h-10 w-10 justify-center ring-default"
            aria-label="More ways to start"
          />
        </UDropdownMenu>
      </div>
    </div>
    <p v-if="template.deploy?.env?.length" class="text-xs text-muted">
      Needs {{ template.deploy.env.length }} environment variables to run. Your host asks for them while deploying.
    </p>
  </div>

  <div v-else-if="template.purchase" class="flex flex-col sm:flex-row sm:items-center gap-3">
    <UButton
      :to="template.purchase"
      target="_blank"
      label="Get This Template"
      trailing-icon="i-lucide-arrow-up-right"
      class="h-10 self-start"
      @click="track('Template Action', { template: template.name, action: 'Purchase' })"
    />
    <p class="text-sm text-muted text-pretty">
      Sold by its author on their website. Nuxt doesn't review or check paid templates.
    </p>
  </div>
</template>
