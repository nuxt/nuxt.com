<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

useSeoMeta({
  title: 'Settings',
  robots: 'noindex'
})

const { user } = useUserSession()
const colorMode = useColorMode()

const { data: account } = useFetch('/api/account', { key: 'account', server: false })

const deleteOpen = ref(false)

const memberSince = computed(() => account.value?.createdAt
  ? new Date(account.value.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  : undefined)

const stats = computed(() => [
  { label: 'Chats with Nuxi', value: account.value?.chats },
  { label: 'Messages', value: account.value?.messages }
])

const themes = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' }
] as const
</script>

<template>
  <UDashboardPanel id="settings" :ui="{ body: 'p-0 sm:p-0' }">
    <template #header>
      <UDashboardNavbar title="Settings" class="bg-default sm:px-4" />
    </template>

    <template #body>
      <UContainer class="flex flex-col gap-6 py-8 sm:py-10">
        <!-- Profile -->
        <section class="rounded-lg ring ring-default bg-default overflow-hidden">
          <div class="p-5 sm:p-6">
            <h2 class="text-sm font-semibold text-highlighted">
              Profile
            </h2>
            <p class="text-sm text-muted mt-1">
              Your name and avatar come from GitHub and refresh each time you sign in.
            </p>

            <div class="flex items-center gap-4 mt-5">
              <UAvatar :src="user?.avatar" :alt="user?.username" class="size-12 ring ring-default" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-highlighted truncate">
                  {{ user?.name || user?.username }}
                </p>
                <p class="text-sm text-muted truncate">
                  @{{ user?.username }}
                </p>
              </div>
              <UBadge
                v-if="user?.role === 'admin'"
                label="Admin"
                color="neutral"
                variant="outline"
                size="sm"
              />
            </div>

            <dl class="grid grid-cols-3 mt-5 pt-5 border-t border-default">
              <div v-for="stat in stats" :key="stat.label">
                <dt class="text-xs text-muted">
                  {{ stat.label }}
                </dt>
                <dd class="text-lg font-medium text-highlighted mt-0.5">
                  <SettingsNumber v-if="stat.value !== undefined" :value="stat.value" />
                  <template v-else>
                    —
                  </template>
                </dd>
              </div>
              <div>
                <dt class="text-xs text-muted">
                  Member since
                </dt>
                <dd class="text-lg font-medium text-highlighted mt-0.5">
                  {{ memberSince ?? '—' }}
                </dd>
              </div>
            </dl>
          </div>

          <div class="flex items-center justify-between gap-4 px-5 sm:px-6 py-3 border-t border-default bg-elevated/40">
            <p class="flex items-center gap-1.5 text-xs text-muted whitespace-nowrap">
              <UIcon name="i-simple-icons-github" class="size-3.5 shrink-0" />
              <span><span class="hidden sm:inline">Signed in with </span>GitHub</span>
            </p>
            <div class="flex items-center gap-1">
              <UButton
                to="/nuxters"
                label="Nuxter profile"
                color="neutral"
                variant="ghost"
                size="xs"
              />
              <UButton
                :to="`https://github.com/${user?.username}`"
                target="_blank"
                label="GitHub"
                trailing-icon="i-lucide-arrow-up-right"
                color="neutral"
                variant="ghost"
                size="xs"
              />
            </div>
          </div>
        </section>

        <!-- Appearance -->
        <section class="rounded-lg ring ring-default bg-default p-5 sm:p-6">
          <h2 class="text-sm font-semibold text-highlighted">
            Appearance
          </h2>
          <p class="text-sm text-muted mt-1">
            Choose how nuxt.com looks on this device.
          </p>

          <ClientOnly>
            <div role="group" aria-label="Theme" class="grid grid-cols-3 gap-3 mt-5 max-w-lg">
              <button
                v-for="theme in themes"
                :key="theme.value"
                type="button"
                :aria-pressed="colorMode.preference === theme.value"
                class="group flex flex-col gap-2 text-start focus-visible:outline-none"
                @click="colorMode.preference = theme.value"
              >
                <span
                  class="relative block aspect-[16/10] rounded-md overflow-hidden ring transition-shadow duration-150 group-focus-visible:ring-2 group-focus-visible:ring-inverted"
                  :class="colorMode.preference === theme.value ? 'ring-2 ring-inverted' : 'ring-default group-hover:ring-accented'"
                >
                  <span
                    v-for="mode in (theme.value === 'system' ? ['light', 'dark'] : [theme.value])"
                    :key="mode"
                    class="absolute inset-0 flex gap-1 p-1.5"
                    :class="[
                      mode === 'light' ? 'bg-neutral-100' : 'bg-neutral-950',
                      theme.value === 'system' && (mode === 'light' ? '[clip-path:inset(0_50%_0_0)]' : '[clip-path:inset(0_0_0_50%)]')
                    ]"
                  >
                    <span class="w-1/4 rounded-sm flex flex-col gap-1 p-1" :class="mode === 'light' ? 'bg-white' : 'bg-neutral-900'">
                      <span v-for="w in ['w-3/4', 'w-full', 'w-2/3']" :key="w" class="h-1 rounded-full" :class="[w, mode === 'light' ? 'bg-neutral-200' : 'bg-neutral-800']" />
                    </span>
                    <span class="flex-1 rounded-sm flex flex-col gap-1 p-1.5" :class="mode === 'light' ? 'bg-white' : 'bg-neutral-900'">
                      <span class="h-1.5 w-1/2 rounded-full" :class="mode === 'light' ? 'bg-neutral-300' : 'bg-neutral-700'" />
                      <span v-for="w in ['w-full', 'w-5/6']" :key="w" class="h-1 rounded-full" :class="[w, mode === 'light' ? 'bg-neutral-200' : 'bg-neutral-800']" />
                    </span>
                  </span>
                </span>
                <span class="flex items-center gap-1.5 text-sm" :class="colorMode.preference === theme.value ? 'text-highlighted font-medium' : 'text-muted'">
                  <span
                    class="size-3.5 rounded-full ring flex items-center justify-center transition-colors"
                    :class="colorMode.preference === theme.value ? 'ring-inverted bg-inverted' : 'ring-accented'"
                  >
                    <span v-if="colorMode.preference === theme.value" class="size-1.5 rounded-full bg-default" />
                  </span>
                  {{ theme.label }}
                </span>
              </button>
            </div>
          </ClientOnly>
        </section>

        <!-- Delete account -->
        <section class="rounded-lg ring ring-error/30 bg-default overflow-hidden">
          <div class="p-5 sm:p-6">
            <h2 class="text-sm font-semibold text-highlighted">
              Delete account
            </h2>
            <p class="text-sm text-muted mt-1 max-w-prose">
              Permanently remove your nuxt.com account and all of your chats with Nuxi. Your GitHub account is not affected.
            </p>
          </div>
          <div class="flex items-center justify-between gap-4 px-5 sm:px-6 py-3 border-t border-error/20 bg-error/5">
            <p class="text-xs text-muted">
              This action is irreversible.
            </p>
            <UButton
              label="Delete account"
              color="error"
              size="sm"
              @click="deleteOpen = true"
            />
          </div>
        </section>
      </UContainer>

      <SettingsDeleteAccount
        v-model:open="deleteOpen"
        :chats="account?.chats"
        :messages="account?.messages"
      />
    </template>
  </UDashboardPanel>
</template>
