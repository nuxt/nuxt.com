<script setup lang="ts">
const route = useRoute()
const { track } = useAnalytics()
</script>

<template>
  <ULink
    to="https://vercel.com/sandbox"
    target="_blank"
    class="inline-flex items-center gap-1.5 text-xs text-muted hover:text-default transition-colors"
    @click="track('Vercel Sandbox Clicked', { page: route.path })"
  >
    Powered by
    <span class="inline-flex items-center gap-1 font-medium text-default">
      <UIcon name="i-simple-icons-vercel" class="size-3" />
      Vercel Sandbox
    </span>
  </ULink>
</template>
