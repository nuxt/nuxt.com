<script setup lang="ts">
import { z } from 'zod'
import { motion } from 'motion-v'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: false,
  middleware: 'feedback-guest',
  colorMode: 'dark'
})

const route = useRoute()
const { public: { feedback } } = useRuntimeConfig()
const { fetch: fetchSession } = useUserSession()
const errorType = route.query.error as string

const passwordSchema = z.object({
  password: z.string().min(1, 'Please enter a password')
})

type PasswordSchema = z.output<typeof passwordSchema>

const state = reactive({ password: '' })
const loginError = ref<string>()
const isLoading = ref(false)

async function handlePasswordLogin(event: FormSubmitEvent<PasswordSchema>) {
  isLoading.value = true
  loginError.value = undefined

  try {
    await $fetch('/api/auth/password', {
      method: 'POST',
      body: { password: event.data.password }
    })
    await fetchSession()
    await navigateTo(feedback.adminPath)
  } catch {
    loginError.value = 'Invalid password'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-linear-to-br from-primary-50 via-white to-primary-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-primary-950 relative overflow-hidden">
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
            <div class="size-16 mx-auto mb-4 bg-linear-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/25">
              <UIcon name="i-lucide-bar-chart-3" class="size-8 text-white" />
            </div>
          </motion.div>

          <motion.div
            :initial="{ opacity: 0, y: 10 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.5, delay: 0.2 }"
          >
            <h1 class="text-3xl font-bold bg-linear-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-300 bg-clip-text text-transparent mb-2">
              Analytics Dashboard
            </h1>
            <p class="text-muted">
              Sign in to access feedback analytics
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
                description="You are not authorized to access this page."
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
                  Sign in to access the dashboard
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
                  block
                  external
                />
              </motion.div>

              <template v-if="feedback.hasPasswordAuth">
                <div class="flex items-center gap-4">
                  <USeparator class="flex-1" />
                  <span class="text-xs text-muted uppercase">or</span>
                  <USeparator class="flex-1" />
                </div>

                <UForm :schema="passwordSchema" :state="state" class="space-y-4" @submit="handlePasswordLogin">
                  <UFormField label="Password" name="password">
                    <UInput
                      v-model="state.password"
                      type="password"
                      placeholder="Enter admin password"
                      icon="i-lucide-lock"
                      size="lg"
                      class="w-full"
                    />
                  </UFormField>

                  <UAlert
                    v-if="loginError"
                    :title="loginError"
                    icon="i-lucide-alert-circle"
                    color="error"
                    variant="subtle"
                  />

                  <motion.div
                    :while-hover="{ scale: 1.02 }"
                    :while-tap="{ scale: 0.98 }"
                    :transition="{ type: 'spring', stiffness: 400, damping: 25 }"
                  >
                    <UButton
                      type="submit"
                      label="Sign in with password"
                      color="primary"
                      variant="solid"
                      size="lg"
                      block
                      :loading="isLoading"
                    />
                  </motion.div>
                </UForm>
              </template>
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
