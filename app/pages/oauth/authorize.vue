<script setup lang="ts">
definePageMeta({
  layout: false,
  colorMode: 'dark'
})

useSeoMeta({
  title: 'Authorize MCP client',
  robots: 'noindex, nofollow'
})

const route = useRoute()

const { data, error } = await useFetch('/api/oauth/authorize', {
  query: route.query,
  server: false
})

watch(data, (value) => {
  if (value?.status === 'login') {
    navigateTo({ path: '/login', query: { redirect: route.fullPath } })
  }
}, { immediate: true })

const submitting = ref<'approve' | 'deny' | null>(null)
const submitError = ref<string | null>(null)

async function decide(approve: boolean) {
  submitting.value = approve ? 'approve' : 'deny'
  submitError.value = null
  try {
    const { redirect } = await $fetch('/api/oauth/authorize', {
      method: 'POST',
      query: route.query,
      body: { approve }
    })
    window.location.href = redirect
  } catch (err) {
    submitError.value = (err as { statusMessage?: string }).statusMessage || 'Could not complete the authorization.'
    submitting.value = null
  }
}
</script>

<template>
  <div class="min-h-dvh bg-default flex flex-col items-center px-6 py-8 antialiased">
    <NuxtLink to="/" aria-label="Nuxt home" class="inline-flex opacity-80 hover:opacity-100 transition-opacity">
      <NuxtLogo class="h-6 w-auto" />
    </NuxtLink>

    <div class="flex-1 flex flex-col justify-center w-full max-w-sm py-12">
      <div v-if="error" class="flex flex-col gap-4">
        <h1 class="text-2xl font-semibold text-highlighted">
          Something went wrong
        </h1>
        <p class="text-sm text-muted">
          {{ error.statusMessage || error.message }}
        </p>
      </div>

      <div v-else-if="data?.status === 'error'" class="flex flex-col gap-6">
        <div class="flex flex-col gap-3">
          <h1 class="text-2xl font-semibold text-highlighted">
            Cannot authorize this app
          </h1>
          <p class="text-sm/6 text-muted">
            {{ data.error }}
          </p>
        </div>
        <UButton
          v-if="data.redirect"
          :to="data.redirect"
          external
          label="Return to the app"
          color="neutral"
          variant="outline"
          size="lg"
          block
        />
      </div>

      <div v-else-if="data?.status === 'consent'" class="flex flex-col gap-8">
        <div class="flex flex-col gap-3">
          <h1 class="text-2xl font-semibold text-highlighted tracking-[-0.01em]">
            Connect {{ data.client.name }} to the Nuxt admin MCP
          </h1>
          <p class="text-sm/6 text-muted">
            It will act as you on <span class="text-highlighted font-medium">{{ data.resource }}</span>, and can:
          </p>
        </div>

        <ul role="list" class="flex flex-col gap-3">
          <li v-for="item in data.scopes" :key="item.scope" class="flex items-start gap-2.5">
            <div class="size-6 mt-0.5 shrink-0 rounded-md bg-primary/10 border border-primary/15 flex items-center justify-center text-primary">
              <UIcon name="i-lucide-check" class="size-3" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[0.8125rem] font-medium text-highlighted font-mono">
                {{ item.scope }}
              </p>
              <p class="text-xs text-muted mt-0.5 leading-relaxed">
                {{ item.description }}
              </p>
            </div>
          </li>
        </ul>

        <div class="flex items-center gap-3 rounded-lg border border-default p-3">
          <UAvatar :src="data.user.avatar" :alt="data.user.username" size="sm" />
          <p class="text-xs text-muted flex-1 min-w-0">
            Signed in as <span class="text-highlighted font-medium">@{{ data.user.username }}</span>.
            You will return to <span class="text-highlighted font-mono break-all">{{ data.client.redirectHost }}</span>.
          </p>
        </div>

        <UAlert
          v-if="submitError"
          color="error"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          :title="submitError"
        />

        <div class="grid grid-cols-2 gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="outline"
            size="lg"
            block
            :loading="submitting === 'deny'"
            :disabled="submitting !== null"
            @click="decide(false)"
          />
          <UButton
            label="Allow access"
            color="primary"
            size="lg"
            block
            :loading="submitting === 'approve'"
            :disabled="submitting !== null"
            @click="decide(true)"
          />
        </div>

        <p class="text-[0.6875rem] text-dimmed leading-relaxed">
          Only allow apps you started connecting yourself. Access lasts until you stop using the app for 30 days, and ends within an hour of leaving the Nuxt admins.
        </p>
      </div>

      <div v-else class="flex items-center justify-center gap-2 text-sm text-muted">
        <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
        Loading…
      </div>
    </div>
  </div>
</template>
