<script setup lang="ts">
import { raycastReturnTo } from '~~/shared/utils/raycast'

definePageMeta({ layout: false, colorMode: 'dark' })
useSeoMeta({ title: 'Connect Nuxi to Raycast', robots: 'noindex, nofollow' })
useHead({ meta: [{ name: 'referrer', content: 'no-referrer' }] })

const route = useRoute()
const { user, loggedIn, ready } = useUserSession()
const returnTo = computed(() => raycastReturnTo(route.query.return_to))
const connecting = ref(false)
const error = ref('')
const githubHref = computed(() => `/api/auth/github?redirect=${encodeURIComponent(route.fullPath)}`)

async function connect() {
  if (!returnTo.value || connecting.value) return
  connecting.value = true
  error.value = ''
  try {
    const result = await $fetch('/api/auth/raycast', { method: 'POST', body: { returnTo: returnTo.value } })
    await navigateTo(result.redirectTo, { external: true })
  } catch (cause) {
    const status = (cause as { statusCode?: number }).statusCode
    error.value = status === 403 ? 'Nuxi in Raycast is currently available to the Nuxt team.' : 'Could not connect. Try again from Raycast.'
  } finally {
    connecting.value = false
  }
}
</script>

<template>
  <main class="min-h-dvh flex items-center justify-center bg-default px-6 py-12">
    <div class="w-full max-w-sm space-y-6">
      <NuxtLogo class="h-7 w-auto" />
      <div class="space-y-2">
        <h1 class="text-2xl font-semibold text-highlighted">
          Connect Nuxi to Raycast
        </h1>
        <p class="text-sm text-muted">
          Chat with Nuxi in Raycast using your nuxt.com account.
        </p>
      </div>
      <UAlert v-if="!returnTo" color="neutral" description="Open Nuxi’s sign-in page from Raycast to connect." />
      <div v-else-if="!loggedIn" class="space-y-5">
        <UButton
          :to="githubHref"
          label="Continue with GitHub"
          icon="i-simple-icons-github"
          color="neutral"
          size="lg"
          block
          external
          :loading="!ready"
        />
        <p class="text-xs text-dimmed">
          Available to the Nuxt team. Use your existing nuxt.com login.
        </p>
      </div>
      <div v-else class="space-y-5">
        <p class="text-sm text-muted">
          Signed in as <span class="font-medium text-highlighted">{{ user?.username }}</span> with GitHub.
          Your conversations will belong to this account.
        </p>
        <UAlert v-if="error" color="error" :description="error" role="alert" />
        <UButton
          label="Connect to Raycast"
          icon="i-lucide-arrow-up-right"
          block
          size="lg"
          :loading="connecting"
          @click="connect"
        />
        <p class="text-xs text-dimmed">
          You’ll return to Raycast to finish connecting.
        </p>
      </div>
    </div>
  </main>
</template>
