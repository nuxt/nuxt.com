<script setup lang="ts">
import { motion } from 'motion-v'

definePageMeta({
  layout: false,
  middleware: 'guest',
  colorMode: 'dark'
})

const route = useRoute()

const redirect = computed(() => {
  const value = route.query.redirect
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return null
  }
  return value
})

const githubHref = computed(() => {
  if (!redirect.value) return '/api/auth/github'
  return `/api/auth/github?redirect=${encodeURIComponent(redirect.value)}`
})

useSeoMeta({
  title: 'Sign in · Nuxt',
  description: 'Sign in to nuxt.com with your GitHub account.'
})
</script>

<template>
  <div class="min-h-dvh bg-linear-to-br from-primary-50 via-white to-primary-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-primary-950 relative overflow-hidden">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 size-80 bg-primary-500/10 rounded-full blur-3xl" />
      <div class="absolute -bottom-40 -left-40 size-80 bg-primary-500/10 rounded-full blur-3xl" />
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-primary-500/5 rounded-full blur-3xl" />
    </div>

    <motion.div
      :initial="{ opacity: 0, x: -20 }"
      :animate="{ opacity: 1, x: 0 }"
      :transition="{ duration: 0.5, delay: 0.2 }"
      class="absolute top-8 left-8 z-10"
    >
      <UTooltip text="Back to home">
        <UButton
          icon="i-lucide-arrow-left"
          to="/"
          size="lg"
          color="neutral"
          variant="subtle"
          aria-label="Back to home"
        />
      </UTooltip>
    </motion.div>

    <div class="flex items-center justify-center min-h-dvh px-4 py-8">
      <motion.div
        :initial="{ opacity: 0, y: 20, scale: 0.95 }"
        :animate="{ opacity: 1, y: 0, scale: 1 }"
        :transition="{ duration: 0.6, ease: 'easeOut' }"
        class="w-full max-w-md"
      >
        <motion.div
          :initial="{ opacity: 0, scale: 0.8 }"
          :animate="{ opacity: 1, scale: 1 }"
          :transition="{ duration: 0.5, delay: 0.1 }"
          class="mb-10 flex justify-center"
        >
          <NuxtLink to="/" aria-label="Back to home" class="inline-flex">
            <NuxtLogo class="h-8 w-auto" />
          </NuxtLink>
        </motion.div>

        <motion.div
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.5, delay: 0.3 }"
        >
          <UCard class="backdrop-blur-sm bg-default/20 border border-default/20 shadow-xl shadow-black/5">
            <div class="space-y-6">
              <div class="text-center space-y-1.5">
                <h1 class="text-2xl font-semibold tracking-tight text-highlighted">
                  Sign in
                </h1>
                <p class="text-sm text-muted">
                  Use your GitHub account to continue
                </p>
              </div>

              <motion.div
                :while-hover="{ scale: 1.02 }"
                :while-tap="{ scale: 0.98 }"
                :transition="{ type: 'spring', stiffness: 400, damping: 25 }"
              >
                <UButton
                  :to="githubHref"
                  icon="i-simple-icons-github"
                  label="Continue with GitHub"
                  color="neutral"
                  variant="solid"
                  size="lg"
                  class="w-full justify-center shadow-lg"
                  external
                />
              </motion.div>
            </div>
          </UCard>
        </motion.div>
      </motion.div>
    </div>
  </div>
</template>
