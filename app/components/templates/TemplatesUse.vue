<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Template, TemplateHealth } from '#shared/types'

const props = defineProps<{
  template: Template
  health?: TemplateHealth
}>()

const { track } = useAnalytics()

const { preview, deployment, deploying, deployError, downloading, deployPanelOpen: panelOpen, deploy, download } = useLivePreview()
const now = useNow({ interval: 1000 })

/** The visitor's edited version: while its preview runs it ships from the sandbox, and its deployment stays listed until it expires. */
const live = computed(() => preview.value?.template.slug === props.template.slug)
const deployed = computed(() => deployment.value?.slug === props.template.slug && deployment.value.expiresAt > now.value.getTime() ? deployment.value : undefined)
const edited = computed(() => live.value || !!deployed.value)
// A click in the live preview lands in its cross-origin frame, which the page never hears about: the window losing focus to it closes the panel.
useEventListener('blur', () => {
  if (panelOpen.value && document.activeElement instanceof HTMLIFrameElement) panelOpen.value = false
})
onBeforeUnmount(() => panelOpen.value = false)

const deployStartedAt = ref(0)
watch(deploying, value => value && (deployStartedAt.value = Date.now()))
const deployElapsed = computed(() => Math.max(0, Math.floor((now.value.getTime() - deployStartedAt.value) / 1000)))
const expiresIn = computed(() => deployed.value ? Math.max(1, Math.ceil((deployed.value.expiresAt - now.value.getTime()) / 60_000)) : 0)

/** Once deployed, the slider stays done; the Live card's redeploy button sets it up for another deploy. */
const redeploying = ref(false)
watch(deploying, value => value && (redeploying.value = false))

function confirmDeploy() {
  track('Template Action', { template: props.template.name, action: 'Deploy Live Preview' })
  deploy()
}

function downloadZip() {
  track('Template Action', { template: props.template.name, action: 'Download ZIP' })
  download()
}

const providers = computed(() => DEPLOY_PROVIDERS.flatMap((provider) => {
  const url = buildDeployUrl(props.template, provider.value)
  return url ? [{ ...provider, url }] : []
}))

const deployItems = computed<DropdownMenuItem[][]>(() => providers.value.length
  ? [
      providers.value.map(provider => ({
        label: provider.label,
        icon: provider.icon,
        to: provider.url,
        target: '_blank',
        onSelect: () => track('Template Action', { template: props.template.name, action: `Deploy ${provider.label}` })
      })),
      [{ label: 'Other Providers', icon: 'i-lucide-server', to: '/deploy', onSelect: () => track('Template Action', { template: props.template.name, action: 'Deploy Other' }) }]
    ]
  : [])
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
        <UPopover v-if="edited" v-model:open="panelOpen" :content="{ align: 'end', sideOffset: 8 }">
          <!-- The trigger carries the deploy's state, so it stays visible once the panel closes. -->
          <UButton
            trailing-icon="i-lucide-chevron-down"
            color="neutral"
            variant="subtle"
            class="h-10 flex-1 sm:flex-none sm:w-44 ring-default tabular-nums"
            :ui="{ trailingIcon: 'ms-auto' }"
            :aria-label="deploying ? `Deploying, ${deployElapsed} seconds` : deployed ? 'Deployed: live on Vercel' : 'Deploy your version'"
          >
            <template #leading>
              <span class="relative flex size-4 items-center justify-center">
                <template v-if="deploying">
                  <span class="absolute size-2 rounded-full bg-primary animate-ping opacity-60" />
                  <span class="relative size-2 rounded-full bg-primary" />
                </template>
                <span v-else-if="deployed" class="size-2 rounded-full bg-success shadow-[0_0_0_3px] shadow-success/20" />
                <UIcon v-else name="i-lucide-rocket" class="size-4 text-primary" />
              </span>
            </template>
            <span class="text-start">{{ deploying ? `Deploying ${deployElapsed}s` : deployed ? 'Live' : 'Deploy' }}</span>
          </UButton>

          <template #content>
            <div class="w-[min(22rem,calc(100vw-2rem))]">
              <div class="p-4 flex flex-col gap-3.5">
                <div class="flex flex-col gap-0.5">
                  <p class="text-sm font-medium text-highlighted">
                    Ship your version
                  </p>
                  <p v-if="deployError && !deploying" class="min-h-[2lh] text-xs text-error text-pretty" role="alert">
                    {{ deployError }}
                  </p>
                  <p v-else class="min-h-[2lh] text-xs text-muted text-pretty">
                    {{ deploying ? 'Building your edits. Live editing pauses until it finishes.' : deployed ? 'Claim it to keep it in your Vercel account, or it disappears when the timer ends.' : 'Your edits go live on Vercel in about a minute. No account needed.' }}
                  </p>
                </div>

                <div v-if="deployed" class="rounded-lg bg-elevated/50 ring ring-default ps-3 pe-2 py-2 flex items-center gap-3 transition-opacity duration-200" :class="deploying && 'opacity-50 pointer-events-none'">
                  <ULink :to="deployed.url" target="_blank" class="group min-w-0 flex-1 flex flex-col gap-0.5">
                    <span class="flex items-center gap-1.5 text-xs font-medium text-highlighted">
                      <span class="size-1.5 rounded-full bg-success" />
                      Live
                      <span class="font-normal text-muted">· {{ expiresIn }} min left</span>
                    </span>
                    <span class="truncate font-mono text-xs text-muted group-hover:text-highlighted transition-colors">{{ deployed.url.replace(/^https:\/\//, '') }}</span>
                  </ULink>
                  <UTooltip v-if="live && !redeploying" text="Deploy your latest edits">
                    <UButton
                      icon="i-lucide-rotate-cw"
                      aria-label="Deploy again"
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      class="shrink-0"
                      @click="redeploying = true"
                    />
                  </UTooltip>
                  <UTooltip text="Keeps it live. Anyone with this link can claim it, so keep it to yourself.">
                    <UButton
                      :to="deployed.claimUrl"
                      target="_blank"
                      label="Claim"
                      icon="i-simple-icons-vercel"
                      color="neutral"
                      variant="outline"
                      size="xs"
                      class="shrink-0"
                      :ui="{ leadingIcon: 'size-3' }"
                      @click="track('Template Action', { template: template.name, action: 'Claim Deploy' })"
                    />
                  </UTooltip>
                </div>

                <TemplatesSlideToDeploy
                  v-if="live"
                  :label="deployed ? 'Slide to redeploy' : 'Slide to deploy'"
                  :busy-label="`Deploying to Vercel · ${deployElapsed}s`"
                  :busy="deploying"
                  :done="!!deployed && !redeploying"
                  done-label="Live on Vercel"
                  @confirm="confirmDeploy"
                />
              </div>

              <div class="px-2 py-1.5 border-t border-default flex items-center gap-1">
                <UButton
                  v-if="live"
                  label="Download ZIP"
                  icon="i-lucide-download"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :loading="downloading"
                  @click="downloadZip"
                />
                <div class="ms-auto flex items-center gap-0.5">
                  <span class="me-1 text-xs text-dimmed">Original</span>
                  <UTooltip v-for="provider in providers" :key="provider.value" :text="`Deploy the original template to ${provider.label}`">
                    <UButton
                      :to="provider.url"
                      target="_blank"
                      :icon="provider.icon"
                      :aria-label="`Deploy the original template to ${provider.label}`"
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      @click="track('Template Action', { template: template.name, action: `Deploy ${provider.label}` })"
                    />
                  </UTooltip>
                  <UTooltip text="Other providers">
                    <UButton
                      to="/deploy"
                      icon="i-lucide-server"
                      aria-label="Other providers"
                      color="neutral"
                      variant="ghost"
                      size="xs"
                    />
                  </UTooltip>
                </div>
              </div>
            </div>
          </template>
        </UPopover>
        <UDropdownMenu v-else-if="deployItems.length" :items="deployItems" :content="{ align: 'end' }">
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
