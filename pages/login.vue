<template>
  <div class="h-full min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <NuxtLink to="/">
          <Logo class="h-12 mx-auto u-text-black" />
        </NuxtLink>
      </div>

      <div v-if="user" class="text-center">
        <p v-if="!user.beta" class="mt-2 u-text-gray-500">
          Thank you for joining Nuxt beta program!<br>
          You will receive an email once accepted.
        </p>
        <p class="font-semibold mb-1.5 mt-6 text-sm u-text-gray-700 tracking-wide">
          Connected as:
        </p>
        <div class="flex items-center justify-center gap-3">
          <UAvatar
            :src="user.avatar"
            :alt="user.username"
            size="xs"
          />

          <span class="font-medium text-sm">{{ user.username || user.email }}</span>
        </div>
      </div>
      <div v-else>
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold u-text-gray-900">
            Sign in to your account
          </h2>
          <p class="mt-2 text-center text-sm u-text-gray-600">
            Or
            {{ ' ' }}
            <NuxtLink to="/register" class="font-medium u-text-gray-800 hover:underline">
              create a new account
            </NuxtLink>
          </p>
        </div>

        <UCard custom-class="mt-8" body-class="px-4 py-5 sm:px-6 space-y-6" padded @submit.prevent="onSubmit">
          <UFormGroup name="email" label="Email address">
            <UInput
              v-model="form.identifier"
              name="email"
              type="email"
              required
              autofocus
              placeholder="Email address"
              size="lg"
            />
          </UFormGroup>
          <UFormGroup name="password" label="Password">
            <UInput
              v-model="form.password"
              name="password"
              type="password"
              required
              placeholder="Password"
              size="lg"
            />
          </UFormGroup>
          <div class="flex items-center justify-end">
            <div class="text-sm">
              <NuxtLink :to="forgotLink" class="font-medium u-text-gray-800 hover:underline">
                Forgot your password?
              </NuxtLink>
            </div>
          </div>
          <UButton
            :loading="loading"
            type="submit"
            icon="heroicons-outline:arrow-right"
            trailing
            size="lg"
            label="Sign in"
            block
          />
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white u-text-gray-500"> Or continue with </span>
            </div>
          </div>
          <UButton
            block
            label="GitHub"
            size="lg"
            icon="fa-brands:github"
            variant="secondary"
            @click="onClick"
          />
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { User } from '~/types'

definePageMeta({
  layout: false
})

const { getProviderAuthenticationUrl } = useStrapiAuth()
const { login } = useStrapiAuth()
const user = useStrapiUser() as Ref<User>
const router = useRouter()
const route = useRoute()
const { $toast } = useNuxtApp()

const loading = ref(false)
const form = reactive({ identifier: '', password: '' })
const forgotLink = computed(() => `/forgot${form.identifier ? `?email=${form.identifier}` : ''}`)

const onClick = () => {
  window.location = getProviderAuthenticationUrl('github') as unknown as Location
}

const onSubmit = async () => {
  loading.value = true

  try {
    await login(form)

    const redirect = useCookie('redirect').value
    if (redirect) {
      router.push(redirect)
      useCookie('redirect').value = null
    } else {
      router.push('/dashboard')
    }
  } catch (e) {}

  loading.value = false
}

onMounted(() => {
  if (user.value && user.value.beta) {
    router.push('/dashboard')
  }

  if (route.query.confirmed) {
    $toast.success({
      title: 'Email confirmed!',
      description: 'You can now login to your account.'
    })
  }
})
</script>
