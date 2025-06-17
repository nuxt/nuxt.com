<script setup lang="ts">
import { motion } from 'motion-v'

definePageMeta({
  layout: false,
  middleware: 'guest',
  colorMode: 'dark'
})

const route = useRoute()
const errorType = route.query.error as string
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-primary-950 relative overflow-hidden">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
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

    <div class="flex items-center justify-center min-h-screen px-4 py-8">
      <motion.div
        :initial="{ opacity: 0, y: 20, scale: 0.95 }"
        :animate="{ opacity: 1, y: 0, scale: 1 }"
        :transition="{ duration: 0.6, ease: 'easeOut' }"
        class="w-full max-w-md"
      >
        <div class="text-center mb-8">
          <motion.div
            :initial="{ opacity: 0, scale: 0.8 }"
            :animate="{ opacity: 1, scale: 1 }"
            :transition="{ duration: 0.5, delay: 0.1 }"
            class="mb-6"
          >
            <div class="size-16 mx-auto mb-4 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/25">
              <UIcon name="i-lucide-bar-chart-3" class="size-8 text-white" />
            </div>
          </motion.div>

          <motion.div
            :initial="{ opacity: 0, y: 10 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.5, delay: 0.2 }"
          >
            <h1 class="text-3xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-300 bg-clip-text text-transparent mb-2">
              Analytics Dashboard
            </h1>
            <p class="text-muted">
              Sign in to access Nuxt.com feedback analytics
            </p>
          </motion.div>
        </div>

        <motion.div
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.5, delay: 0.3 }"
        >
          <UCard class="backdrop-blur-sm bg-default/20 border border-default/20 shadow-xl shadow-black/5">
            <motion.div
              v-if="errorType === 'access-denied'"
              :initial="{ opacity: 0, height: 0 }"
              :animate="{ opacity: 1, height: 'auto' }"
              :transition="{ duration: 0.4 }"
              class="mb-6"
            >
              <UAlert
                title="Access Denied"
                description="Only Nuxt core team members can access this page."
                icon="i-lucide-shield-x"
                color="error"
                variant="subtle"
              />
            </motion.div>

            <div class="space-y-6">
              <div class="text-center">
                <h2 class="text-xl font-semibold mb-2">
                  Welcome back
                </h2>
                <p class="text-sm text-muted">
                  Continue with your GitHub account to access the dashboard
                </p>
              </div>

              <motion.div
                :while-hover="{ scale: 1.02 }"
                :while-tap="{ scale: 0.98 }"
                :transition="{ type: 'spring', stiffness: 400, damping: 25 }"
              >
                <UButton
                  to="/api/auth/github"
                  icon="i-simple-icons-github"
                  label="Continue with GitHub"
                  color="neutral"
                  variant="solid"
                  size="lg"
                  class="w-full justify-center shadow-lg"
                  external
                />
              </motion.div>

              <div class="text-center pt-4 border-t border-default">
                <p class="text-xs text-muted">
                  Restricted access • Core team members only
                </p>
              </div>
            </div>
          </UCard>
        </motion.div>

        <motion.div
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :transition="{ duration: 0.5, delay: 0.6 }"
          class="text-center mt-8"
        >
          <UButton
            to="https://github.com/nuxt/nuxt"
            variant="ghost"
            color="neutral"
            size="sm"
            icon="i-simple-icons-github"
            label="View Nuxt on GitHub"
            external
          />
        </motion.div>
      </motion.div>
    </div>
  </div>
</template>
