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
  description: 'Sign in to nuxt.com with your GitHub account to access chat history and more.'
})

const features = [
  {
    icon: 'i-lucide-history',
    title: 'Chat history',
    description: 'Your conversations with the Nuxt Agent are saved and accessible across all your devices.'
  },
  {
    icon: 'i-lucide-message-circle',
    title: 'Nuxt Agent',
    description: 'Ask questions about Nuxt, modules, deployment, and more — powered by the official documentation.'
  },
  {
    icon: 'i-lucide-git-branch',
    title: 'Branch & explore',
    description: 'Branch any conversation to explore a different direction without losing your original thread.'
  }
]
</script>

<template>
  <div class="min-h-dvh bg-linear-to-br from-primary-50 via-white to-primary-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-primary-950 relative overflow-hidden flex flex-col">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 size-80 bg-primary-500/10 rounded-full blur-3xl" />
      <div class="absolute -bottom-40 -left-40 size-80 bg-primary-500/10 rounded-full blur-3xl" />
    </div>

    <div class="px-4 pt-4">
      <UButton
        icon="i-lucide-arrow-left"
        to="/"
        color="neutral"
        variant="subtle"
        aria-label="Back to home"
      />
    </div>

    <div class="flex-1 flex items-center justify-center px-4 py-8">
      <div class="w-full max-w-4xl flex flex-col lg:flex-row gap-12 items-center">
        <!-- Left: features -->
        <motion.div
          :initial="{ opacity: 0, x: -24 }"
          :animate="{ opacity: 1, x: 0 }"
          :transition="{ duration: 0.6, ease: 'easeOut' }"
          class="flex-1 flex flex-col gap-8"
        >
          <div>
            <NuxtLink to="/" aria-label="Back to home" class="inline-flex mb-6">
              <NuxtLogo class="h-7 w-auto" />
            </NuxtLink>
            <h1 class="text-3xl sm:text-4xl font-semibold text-highlighted tracking-tight">
              Sign in to unlock<br>the full experience
            </h1>
            <p class="mt-3 text-muted text-lg">
              Use your GitHub account to save your chat history and access all features.
            </p>
          </div>

          <div class="flex flex-col gap-5">
            <motion.div
              v-for="(feature, i) in features"
              :key="feature.title"
              :initial="{ opacity: 0, y: 12 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ duration: 0.4, delay: 0.3 + i * 0.1, ease: 'easeOut' }"
              class="flex items-start gap-3"
            >
              <div class="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <UIcon :name="feature.icon" class="size-4.5 text-primary" />
              </div>
              <div>
                <p class="font-medium text-highlighted text-sm">
                  {{ feature.title }}
                </p>
                <p class="text-muted text-sm mt-0.5">
                  {{ feature.description }}
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <!-- Right: sign-in card -->
        <motion.div
          :initial="{ opacity: 0, y: 20, scale: 0.97 }"
          :animate="{ opacity: 1, y: 0, scale: 1 }"
          :transition="{ duration: 0.6, ease: 'easeOut' }"
          class="w-full max-w-sm"
        >
          <UCard class="backdrop-blur-sm bg-default/20 border border-default/20 shadow-xl shadow-black/5">
            <div class="space-y-6">
              <div class="text-center space-y-1.5">
                <h2 class="text-xl font-semibold tracking-tight text-highlighted">
                  Welcome
                </h2>
                <p class="text-sm text-muted">
                  Sign in with your GitHub account to continue
                </p>
              </div>

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

              <div class="space-y-2 pt-2 border-t border-default/30">
                <div class="flex items-start gap-2 text-xs text-muted">
                  <UIcon name="i-lucide-shield-check" class="size-3.5 shrink-0 mt-0.5 text-success" />
                  <span>We never store your GitHub token — only a secure session cookie.</span>
                </div>
                <div class="flex items-start gap-2 text-xs text-muted">
                  <UIcon name="i-lucide-database" class="size-3.5 shrink-0 mt-0.5 text-primary" />
                  <span>Your account data (username, avatar) is saved to associate your chat history.</span>
                </div>
              </div>
            </div>
          </UCard>
        </motion.div>
      </div>
    </div>
  </div>
</template>
