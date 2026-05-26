<script setup lang="ts">
const route = useRoute()
const { loggedIn } = useUserSession()

const loginHref = computed(() => `/login?redirect=${encodeURIComponent(route.fullPath)}`)
</script>

<template>
  <div
    v-if="!loggedIn"
    class="flex items-center gap-3 border-b border-default bg-muted/30 px-4 py-2.5"
  >
    <UIcon name="i-lucide-history" class="size-4 shrink-0 text-dimmed" />
    <p class="min-w-0 flex-1 text-xs leading-relaxed text-muted">
      Save your chats and keep your history across devices.
    </p>
    <UButton
      :to="loginHref"
      icon="i-simple-icons-github"
      label="Sign in"
      size="xs"
      color="neutral"
      variant="outline"
      class="shrink-0"
    />
  </div>
</template>
