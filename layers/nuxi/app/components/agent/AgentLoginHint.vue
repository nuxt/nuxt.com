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
  <NuxtLink
    v-if="!loggedIn"
    :to="loginHref"
    class="flex items-center transition-colors hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    :class="attached
      ? 'w-[95%] max-w-full gap-2 rounded-t-lg rounded-b-none border border-b-0 border-default bg-muted/30 px-3 py-1.5'
      : 'min-w-0 gap-2 py-1'"
  >
    <UIcon
      name="i-lucide-history"
      class="shrink-0 text-dimmed"
      :class="attached ? 'size-4' : 'size-3.5'"
    />
    <p
      class="text-xs"
      :class="attached ? 'min-w-0 flex-1 truncate text-muted' : 'min-w-0 flex-1 truncate text-dimmed'"
    >
      Save your chats and keep your history across devices.
    </p>
    <UButton
      color="neutral"
      size="xs"
      variant="link"
      icon="i-simple-icons-github"
      icon-class="size-3.5"
      class="shrink-0"
      label="Sign in"
    />
  </NuxtLink>
</template>
