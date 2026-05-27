<script setup lang="ts">
withDefaults(defineProps<{
  /** Tighter padding when stacked directly above the chat prompt */
  attached?: boolean
}>(), {
  attached: false
})

const route = useRoute()
const { loggedIn } = useUserSession()

const loginHref = computed(() => `/login?redirect=${encodeURIComponent(route.fullPath)}`)
</script>

<template>
  <div
    v-if="!loggedIn"
    class="flex items-center min-w-0"
    :class="attached
      ? 'gap-3 border-b border-default bg-muted/30 px-4 py-2.5'
      : 'gap-2 py-1'"
  >
    <UIcon
      name="i-lucide-history"
      class="shrink-0 text-dimmed"
      :class="attached ? 'size-4' : 'size-3.5'"
    />
    <p
      class="min-w-0 flex-1 text-xs leading-relaxed"
      :class="attached ? 'text-muted' : 'text-dimmed'"
    >
      Save your chats and keep your history across devices.
    </p>
    <UButton
      :to="loginHref"
      icon="i-simple-icons-github"
      label="Sign in"
      size="xs"
      color="neutral"
      :variant="attached ? 'outline' : 'link'"
      class="shrink-0"
    />
  </div>
</template>
