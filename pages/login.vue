<template>
  <div class="h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <NuxtLink to="/">
          <LogoFull class="mx-auto text-black" />
        </NuxtLink>
      </div>

      <div v-if="user" class="text-center">
        <p v-if="!user.beta" class="text-sm mt-2 u-text-gray-500">
          Thank you for joining Nuxt beta program!<br>
          You will receive an email once accepted.
        </p>
        <p class="font-semibold mb-1.5 -mt-px text-sm u-text-gray-700 tracking-wide mt-8">
          Connected as:
        </p>
        <div class="flex items-center justify-center gap-3">
          <UAvatar
            :src="user.avatar"
            :alt="user.username"
            size="xs"
          />

          <span class="font-medium text-sm">{{ user.username }}</span>
        </div>
      </div>
      <UButton
        v-else
        block
        label="Connect with GitHub"
        size="xl"
        icon="fa-brands:github"
        @click="onClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { User } from '~/types'

const { getProviderAuthenticationUrl } = useStrapiAuth()

definePageMeta({
  layout: false
})

const user = useStrapiUser() as Ref<User>
const router = useRouter()

const onClick = () => {
  window.location = getProviderAuthenticationUrl('github') as unknown as Location
}

onMounted(() => {
  if (user.value && user.value.beta) {
    router.push('/dashboard')
  }
})
</script>
