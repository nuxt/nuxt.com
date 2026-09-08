<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })

const { data, status, error, execute } = useFetch('/api/admin/mcp-install', {
  immediate: false,
  default: () => null
})

watch(open, (isOpen) => {
  if (isOpen && !data.value) execute()
})

const jsonString = computed(() =>
  data.value ? JSON.stringify(data.value.json, null, 2) : ''
)

const { copy: copyJson, copied: jsonCopied } = useClipboard()
</script>

<template>
  <UModal v-model:open="open" :ui="{ content: 'max-w-xl' }">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="font-semibold text-lg flex items-center gap-2">
                <UIcon name="i-lucide-plug" class="size-5 text-primary" />
                Install Admin MCP
              </h3>
              <p class="text-sm text-muted mt-1">
                Connect your IDE to the Nuxt admin MCP server to query feedback and AI agent data from the chat.
              </p>
            </div>
            <UButton
              size="sm"
              variant="ghost"
              color="neutral"
              icon="i-lucide-x"
              @click="open = false"
            />
          </div>
        </template>

        <div v-if="status === 'pending'" class="flex items-center gap-2 text-sm text-muted">
          <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
          Loading install info…
        </div>

        <UAlert
          v-else-if="error"
          color="error"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          title="Could not load install info"
          :description="error.message"
        />

        <div v-else-if="data" class="space-y-5">
          <div class="grid grid-cols-2 gap-2">
            <UButton
              :to="data.deeplinks.cursor"
              external
              color="neutral"
              variant="solid"
              icon="i-simple-icons-cursor"
              label="Install in Cursor"
              block
            />
            <UButton
              :to="data.deeplinks.vscode"
              external
              color="neutral"
              variant="outline"
              icon="i-simple-icons-visualstudiocode"
              label="Install in VS Code"
              block
            />
          </div>

          <USeparator label="or configure manually" />

          <div class="space-y-3">
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-muted uppercase tracking-wide">Server URL</label>
              <UInputCopy :value="data.url" size="lg" />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-medium text-muted uppercase tracking-wide">Bearer token</label>
              <UInputCopy :value="data.token" size="lg" />
            </div>

            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="text-xs font-medium text-muted uppercase tracking-wide">JSON config</label>
                <UButton
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  :icon="jsonCopied ? 'i-lucide-check' : 'i-lucide-copy'"
                  :label="jsonCopied ? 'Copied' : 'Copy'"
                  @click="copyJson(jsonString)"
                />
              </div>
              <pre class="text-xs bg-elevated/50 border border-default rounded-md p-3 overflow-x-auto"><code>{{ jsonString }}</code></pre>
            </div>
          </div>

          <UAlert
            color="warning"
            variant="subtle"
            icon="i-lucide-shield-alert"
            title="Keep this token private"
            description="Anyone with this token has full read access to feedback and agent data. Do not share it or commit it to a public repository."
          />
        </div>
      </UCard>
    </template>
  </UModal>
</template>
