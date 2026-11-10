<script setup lang="ts">
definePageMeta({ layout: false, middleware: 'auth' })
useSeoMeta({ title: 'Connect Nuxt Admin MCP', robots: 'noindex, nofollow' })
const route = useRoute()
const request = computed(() => typeof route.query.request === 'string' ? route.query.request : '')
const { data, error } = await useFetch('/api/mcp/oauth/consent', { query: { request } })
const authorizationError = computed(() => {
  switch (error.value?.statusCode) {
    case 403:
      return 'Your GitHub account does not have access to the Nuxt admin area.'
    case 401:
      return 'Your session has expired. Sign in again, then reconnect from your MCP client.'
    case 400:
      return 'This connection request has expired or is invalid. Connect again from your MCP client.'
    default:
      return 'Could not load this connection request. Try connecting again from your MCP client.'
  }
})
const submitting = ref(false)
const submitError = ref('')

async function decide(allow: boolean) {
  submitting.value = true
  submitError.value = ''
  try {
    const result = await $fetch('/api/mcp/oauth/consent', { method: 'POST', body: { request: request.value, allow } })
    if (!result || !('redirect' in result)) throw new Error('Could not complete the connection. Connect again from your client.')
    window.location.assign(result.redirect)
  } catch (error) {
    submitError.value = error instanceof Error ? error.message : 'Could not complete the connection.'
    submitting.value = false
  }
}
</script>

<template>
  <main class="min-h-screen flex items-center justify-center p-6 bg-default">
    <UCard class="w-full max-w-lg">
      <template #header>
        <div class="flex items-center gap-3">
          <UIcon name="i-simple-icons-nuxtdotjs" class="size-8 text-primary" />
          <h1 class="text-xl font-semibold">
            Connect Nuxt Admin MCP
          </h1>
        </div>
      </template>
      <UAlert v-if="error || !data || !('client' in data)" color="error" title="Cannot authorize this connection" :description="authorizationError" />
      <div v-else class="space-y-5">
        <p><strong class="break-all">{{ data.client.name }}</strong> is asking to connect as <strong>@{{ data.username }}</strong>.</p>
        <p class="text-muted">
          Approving gives this client read access to docs feedback, saved agent chats, votes, Search Console data, and field performance reports.
        </p>
        <div class="rounded-lg border border-default p-3 space-y-1">
          <p class="text-sm font-medium">
            Client callback
          </p>
          <p class="text-xs text-muted break-all">
            {{ data.client.redirectUri }}
          </p>
        </div>
        <p class="text-sm text-muted">
          Client names are self-reported. Only approve a connection you started in a client you trust. This approval expires after 30 days.
        </p>
        <UAlert v-if="submitError" color="error" :description="submitError" />
        <div class="flex gap-3 justify-end">
          <UButton color="neutral" variant="outline" :disabled="submitting" @click="decide(false)">
            Deny
          </UButton>
          <UButton :loading="submitting" @click="decide(true)">
            Approve connection
          </UButton>
        </div>
      </div>
    </UCard>
  </main>
</template>
