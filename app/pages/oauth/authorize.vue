<script setup lang="ts">
import { AnimatePresence, motion } from 'motion-v'
import { MCP_OAUTH_SCOPES, MCP_OAUTH_SCOPE_TOOLS } from '#shared/utils/mcp-admin'
import type { McpOAuthScope } from '#shared/utils/mcp-admin'

// Better Auth's OAuth provider (`mcp()` in `server/utils/auth.ts`) sends people here with the client's
// signed authorization request in the query, once they are signed in.
definePageMeta({
  layout: false,
  colorMode: 'dark'
})

useSeoMeta({
  title: 'Authorize MCP client',
  robots: 'noindex, nofollow'
})

const route = useRoute()
const { user, ready } = useUserSession()

/** What each scope lets the client do, in plain words. */
const CAN: Record<McpOAuthScope, string> = {
  'admin:analytics': 'Read docs feedback, Nuxi usage, Search Console and Core Web Vitals',
  'admin:chats': 'Read Nuxi chats that were shared with admins or made public',
  'admin:templates': 'See template check results and start new checks on Vercel Sandbox'
}

/** Limits that hold whatever scopes are granted. */
const CANNOT = [
  'Read private chats',
  'Change site content or anyone\'s account',
  'Access your GitHub account'
]

const request = computed(() => new URL(route.fullPath, 'http://localhost').searchParams)
const clientId = computed(() => request.value.get('client_id'))

const { data: client, error } = await useFetch<{ client_name?: string, logo_uri?: string }>('/api/auth/oauth2/public-client', {
  query: { client_id: clientId },
  server: false,
  immediate: Boolean(clientId.value)
})

const errorMessage = computed(() => {
  const body = (error.value as { data?: { error_description?: string, message?: string } } | undefined)?.data
  return body?.error_description || body?.message || error.value?.message
})

// Without a session, Better Auth's `/login` resumes the request after GitHub sign-in.
watch(ready, (isReady) => {
  if (isReady && !user.value) navigateTo({ path: '/login', query: route.query })
}, { immediate: true })

const data = computed(() => {
  if (!clientId.value || !request.value.get('sig')) return { status: 'error' as const, error: 'This authorization request is incomplete. Start again from your MCP client.' }
  if (!ready.value || !user.value || !client.value) return null
  if (user.value.role !== 'admin') return { status: 'error' as const, error: 'The admin MCP server is only available to Nuxt admins.' }
  const redirect = new URL(request.value.get('redirect_uri')!)
  const requested = (request.value.get('scope') ?? '').split(' ')
  const name = client.value.client_name || 'This app'
  return {
    status: 'consent' as const,
    client: {
      name,
      logo: client.value.logo_uri,
      initials: name.split(/\s+/).map(word => word[0]).join('').slice(0, 2).toUpperCase(),
      redirectHost: redirect.host || redirect.protocol
    },
    user: { username: user.value.username, avatar: user.value.avatar },
    // `offline_access` only lets the client renew its access, so it's explained in the footnote, not listed.
    scopes: requested.filter((scope): scope is McpOAuthScope => scope in MCP_OAUTH_SCOPES)
      .map(scope => ({ scope, text: CAN[scope], tools: MCP_OAUTH_SCOPE_TOOLS[scope] })),
    staysConnected: requested.includes('offline_access')
  }
})

const openScope = ref<McpOAuthScope | null>(null)
const submitting = ref<'approve' | 'deny' | null>(null)
const approved = ref(false)
const submitError = ref<string | null>(null)

async function decide(approve: boolean) {
  submitting.value = approve ? 'approve' : 'deny'
  submitError.value = null
  try {
    const { url } = await $fetch<{ url: string }>('/api/auth/oauth2/consent', {
      method: 'POST',
      body: { accept: approve, oauth_query: request.value.toString() }
    })
    if (approve) {
      // Let the connection mark settle before leaving the page.
      approved.value = true
      await new Promise(resolve => setTimeout(resolve, 600))
    }
    window.location.href = url
  } catch (err) {
    const body = (err as { data?: { message?: string, error_description?: string } }).data
    submitError.value = body?.error_description || body?.message || 'Could not complete the authorization.'
    submitting.value = null
  }
}

const ease = [0.22, 1, 0.36, 1] as const
</script>

<template>
  <div class="min-h-dvh bg-default flex flex-col items-center justify-center px-5 py-12 antialiased">
    <div v-if="error || data?.status === 'error'" class="w-full max-w-sm flex flex-col gap-3 text-center">
      <h1 class="text-lg font-semibold text-highlighted">
        {{ error ? 'Something went wrong' : 'Cannot authorize this app' }}
      </h1>
      <p class="text-sm/6 text-muted">
        {{ error ? errorMessage : data?.status === 'error' && data.error }}
      </p>
      <UButton
        v-if="!error && clientId && user"
        label="Return to the app"
        color="neutral"
        variant="outline"
        block
        class="mt-3"
        :loading="submitting === 'deny'"
        @click="decide(false)"
      />
    </div>

    <motion.div
      v-else-if="data?.status === 'consent'"
      :initial="{ opacity: 0, y: 8 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.5, ease }"
      class="w-full max-w-[400px] md:max-w-[52rem] grid gap-8 md:grid-cols-[18rem_minmax(0,1fr)] md:grid-rows-[auto_1fr] md:gap-x-14 md:gap-y-0"
    >
      <div class="flex flex-col items-center text-center md:items-start md:text-left md:col-start-1 md:row-start-1">
        <div class="flex items-center" aria-hidden="true">
          <UAvatar :src="data.client.logo" :text="data.client.initials" size="xl" class="rounded-xl ring ring-default bg-elevated" />
          <div class="relative w-16 h-px mx-1 bg-accented overflow-hidden">
            <span v-if="!approved" class="connector-pulse absolute inset-y-0 w-6 bg-linear-to-r from-transparent via-primary to-transparent" />
            <motion.span
              v-else
              :initial="{ scaleX: 0 }"
              :animate="{ scaleX: 1 }"
              :transition="{ duration: 0.35, ease }"
              class="absolute inset-0 bg-primary origin-left"
            />
          </div>
          <div class="relative">
            <div class="size-12 rounded-xl ring ring-default bg-elevated flex items-center justify-center">
              <UIcon name="i-custom-nuxt" class="size-6 text-primary" />
            </div>
            <AnimatePresence>
              <motion.div
                v-if="approved"
                :initial="{ scale: 0 }"
                :animate="{ scale: 1 }"
                :transition="{ type: 'spring', stiffness: 500, damping: 22, delay: 0.25 }"
                class="absolute -right-1.5 -bottom-1.5 size-5 rounded-full bg-primary ring-2 ring-(--ui-bg) flex items-center justify-center"
              >
                <UIcon name="i-lucide-check" class="size-3 text-inverted" />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <h1 class="mt-6 text-xl md:text-2xl font-semibold text-highlighted text-balance tracking-[-0.01em]">
          {{ data.client.name }} wants to access the Nuxt admin MCP
        </h1>
        <p class="mt-2 flex items-center gap-1.5 text-sm text-muted">
          <UAvatar :src="data.user.avatar" :alt="data.user.username" size="3xs" />
          as <span class="text-highlighted font-medium">@{{ data.user.username }}</span>
        </p>
      </div>

      <div class="w-full md:col-start-2 md:row-start-1 md:row-span-2">
        <div class="w-full rounded-xl ring ring-default bg-elevated/40 divide-y divide-default">
          <div class="p-4">
            <p class="text-xs font-medium text-muted">
              It will be able to
            </p>
            <ul role="list" class="mt-2.5 flex flex-col gap-1">
              <motion.li
                v-for="(item, i) in data.scopes"
                :key="item.scope"
                :initial="{ opacity: 0, y: 4 }"
                :animate="{ opacity: 1, y: 0 }"
                :transition="{ duration: 0.35, delay: 0.15 + i * 0.06, ease }"
              >
                <button
                  type="button"
                  class="group w-full flex items-start gap-2.5 rounded-md -mx-1.5 px-1.5 py-1 text-left hover:bg-elevated focus-visible:outline-2 focus-visible:outline-primary"
                  :aria-expanded="openScope === item.scope"
                  @click="openScope = openScope === item.scope ? null : item.scope"
                >
                  <UIcon name="i-lucide-check" class="size-4 mt-0.5 shrink-0 text-primary" />
                  <span class="flex-1 min-w-0 text-sm/5 text-default">{{ item.text }}</span>
                  <UIcon
                    name="i-lucide-chevron-down"
                    class="size-3.5 mt-1 shrink-0 text-dimmed transition-transform duration-200"
                    :class="openScope === item.scope && 'rotate-180'"
                  />
                </button>
                <AnimatePresence>
                  <motion.div
                    v-if="openScope === item.scope"
                    :initial="{ height: 0, opacity: 0 }"
                    :animate="{ height: 'auto', opacity: 1 }"
                    :exit="{ height: 0, opacity: 0 }"
                    :transition="{ duration: 0.2, ease }"
                    class="overflow-hidden"
                  >
                    <p class="pl-6.5 pt-1 pb-1.5 font-mono text-[0.6875rem]/5 text-dimmed">
                      <template v-for="(tool, t) in item.tools" :key="tool">
                        <span v-if="t" aria-hidden="true"> · </span><span class="whitespace-nowrap">{{ tool }}</span>
                      </template>
                    </p>
                  </motion.div>
                </AnimatePresence>
              </motion.li>
            </ul>
          </div>

          <div class="p-4">
            <p class="text-xs font-medium text-muted">
              It won't be able to
            </p>
            <ul role="list" class="mt-2.5 flex flex-col gap-2">
              <li v-for="item in CANNOT" :key="item" class="flex items-start gap-2.5 text-sm/5 text-muted">
                <UIcon name="i-lucide-x" class="size-4 mt-0.5 shrink-0 text-dimmed" />
                {{ item }}
              </li>
            </ul>
          </div>
        </div>

        <UAlert
          v-if="submitError"
          class="mt-4"
          color="error"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          :title="submitError"
        />
      </div>

      <div class="w-full flex flex-col md:col-start-1 md:row-start-2 md:justify-end md:pt-8">
        <div class="flex flex-col gap-1.5 md:flex-row md:gap-2">
          <UButton
            :label="approved ? 'Connected' : 'Allow access'"
            :icon="approved ? 'i-lucide-check' : undefined"
            color="primary"
            size="lg"
            block
            class="md:flex-1"
            :loading="submitting === 'approve' && !approved"
            :disabled="submitting !== null"
            @click="decide(true)"
          />
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            size="lg"
            block
            class="md:w-auto"
            :loading="submitting === 'deny'"
            :disabled="submitting !== null"
            @click="decide(false)"
          />
        </div>

        <p class="mt-5 text-xs/5 text-dimmed text-center text-pretty md:order-first md:mt-0 md:mb-5 md:text-left">
          You'll return to <span class="font-mono text-muted">{{ data.client.redirectHost }}</span>.
          {{ data.staysConnected ? 'It stays connected while you use it, until 30 days without use or until you leave the Nuxt admins.' : 'Access ends when you leave the Nuxt admins.' }}
        </p>
      </div>
    </motion.div>

    <div v-else class="flex items-center gap-2 text-sm text-muted">
      <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
      Loading…
    </div>
  </div>
</template>

<style scoped>
.connector-pulse {
  animation: connector 1.8s ease-in-out infinite;
}

@keyframes connector {
  from { transform: translateX(-24px); }
  to { transform: translateX(64px); }
}

@media (prefers-reduced-motion: reduce) {
  .connector-pulse { animation: none; opacity: 0; }
}
</style>
