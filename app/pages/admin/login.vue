<script setup lang="ts">
definePageMeta({
  middleware: 'guest'
})

const route = useRoute()
const errorType = route.query.error as string
</script>

<template>
  <div class="h-screen flex items-center justify-center px-4">
    <UButton
      icon="i-lucide-chevron-left"
      to="/"
      size="xl"
      color="neutral"
      variant="subtle"
      class="absolute left-8 top-8 rounded-full z-10"
    />

    <UPageCard
      variant="subtle"
      class="max-w-sm w-full"
    >
      <UAlert
        v-if="errorType === 'access-denied'"
        title="Access Denied"
        description="Only Nuxt core team members can access this page."
        icon="i-lucide-shield-x"
        color="error"
        variant="subtle"
      />

      <UButton
        to="/api/auth/github"
        icon="i-simple-icons-github"
        label="Login with GitHub"
        color="neutral"
        size="xs"
        external
      />
    </UPageCard>
  </div>
</template>
