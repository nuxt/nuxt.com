<script setup lang="ts">
withDefaults(defineProps<{
  /** Panel footer row — matches page context bar padding and border */
  bar?: boolean
}>(), {
  bar: false
})

const route = useRoute()
const { loggedIn } = useUserSession()

const loginHref = computed(() => `/login?redirect=${encodeURIComponent(route.fullPath)}`)
</script>

<template>
  <NuxtLink
    v-if="!loggedIn"
    :to="loginHref"
    class="group flex w-full items-center gap-3 text-xs text-dimmed transition-colors hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    :class="bar
      ? 'border-b border-default px-4 py-2.5 hover:bg-muted/40'
      : 'py-1 hover:text-muted'"
  >
    <span class="min-w-0 flex-1 truncate">
      Save your chats and keep your history across devices.
    </span>
    <span class="inline-flex shrink-0 items-center gap-1 font-medium text-default transition-colors group-hover:text-highlighted">
      <UIcon name="i-simple-icons-github" class="size-3.5 transition-colors group-hover:text-highlighted" />
      Sign in
    </span>
  </NuxtLink>
</template>
