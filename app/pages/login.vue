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
    description: 'Your conversations with Nuxi are saved and accessible across all your devices.'
  },
  {
    icon: 'i-lucide-message-circle',
    title: 'Ask Nuxi',
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
  <div class="min-h-dvh bg-[#020420] relative overflow-hidden flex flex-col">
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute -top-40 -right-40 size-[600px] bg-primary-500/10 rounded-full blur-3xl" />
      <div class="absolute -bottom-40 -left-40 size-80 bg-primary-500/8 rounded-full blur-3xl" />
      <div
        class="absolute inset-0 opacity-[0.025]"
        style="background-image: linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px); background-size: 40px 40px;"
      />
    </div>

    <div class="absolute top-4 left-4">
      <UButton
        icon="i-lucide-arrow-left"
        to="/"
        color="neutral"
        variant="ghost"
        size="sm"
        aria-label="Back to home"
      />
    </div>

    <div class="flex-1 flex items-center justify-center px-4 py-16">
      <div class="w-full max-w-4xl flex flex-col lg:flex-row gap-16 items-center">
        <motion.div
          :initial="{ opacity: 0, x: -20 }"
          :animate="{ opacity: 1, x: 0 }"
          :transition="{ duration: 0.6, ease: 'easeOut' }"
          class="flex-1 flex flex-col gap-10"
        >
          <div class="flex flex-col gap-6">
            <NuxtLink to="/" aria-label="Back to home" class="inline-flex">
              <NuxtLogo class="h-7 w-auto" />
            </NuxtLink>

            <div>
              <h1 class="text-3xl sm:text-4xl font-semibold text-highlighted tracking-tight">
                Sign in to unlock<br>the full experience
              </h1>
              <p class="mt-3 text-muted text-base/7">
                Use your GitHub account to save your chat history and access all features.
              </p>
            </div>
          </div>

          <div class="flex flex-col gap-5">
            <motion.div
              v-for="(feature, i) in features"
              :key="feature.title"
              :initial="{ opacity: 0, y: 10 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ duration: 0.4, delay: 0.3 + i * 0.1, ease: 'easeOut' }"
              class="flex items-start gap-4"
            >
              <div class="size-9 rounded-xl bg-primary/10 border border-primary/10 flex items-center justify-center shrink-0">
                <UIcon :name="feature.icon" class="size-4 text-primary" />
              </div>
              <div class="pt-0.5">
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

        <motion.div
          :initial="{ opacity: 0, y: 20, scale: 0.97 }"
          :animate="{ opacity: 1, y: 0, scale: 1 }"
          :transition="{ duration: 0.6, delay: 0.1, ease: 'easeOut' }"
          class="w-full max-w-sm shrink-0"
        >
          <div class="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/50">
            <div class="p-6 flex flex-col gap-6">
              <div class="flex flex-col items-center gap-4 pt-2">
                <motion.div
                  :initial="{ opacity: 0, scale: 0.5 }"
                  :animate="{ opacity: 1, scale: 1 }"
                  :transition="{ duration: 0.5, delay: 0.35, ease: [0.34, 1.56, 0.64, 1] }"
                >
                  <AgentNuxiIcon class="size-14" mood="happy" />
                </motion.div>
                <div class="text-center">
                  <h2 class="text-base font-semibold text-highlighted">
                    Welcome
                  </h2>
                  <p class="text-sm text-muted mt-0.5">
                    Sign in with your GitHub account to continue
                  </p>
                </div>
              </div>

              <UButton
                :to="githubHref"
                icon="i-simple-icons-github"
                label="Continue with GitHub"
                color="neutral"
                variant="solid"
                size="lg"
                class="w-full justify-center"
                external
              />
            </div>

            <div class="px-6 py-4 border-t border-white/6 flex flex-col gap-2.5 bg-white/2">
              <div class="flex items-start gap-2 text-xs text-dimmed">
                <UIcon name="i-lucide-shield-check" class="size-3.5 shrink-0 mt-0.5 text-success" />
                <span>We never store your GitHub token — only a secure session cookie.</span>
              </div>
              <div class="flex items-start gap-2 text-xs text-dimmed">
                <UIcon name="i-lucide-database" class="size-3.5 shrink-0 mt-0.5 text-primary" />
                <span>Your account data (username, avatar) is saved to associate your chat history.</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </div>
</template>
