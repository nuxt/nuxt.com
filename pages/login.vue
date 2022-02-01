<template>
  <div class="h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <NuxtLink to="/">
          <LogoFull class="mx-auto text-black" />
        </NuxtLink>
      </div>

      <UButton
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
const { getProviderAuthenticationUrl } = useStrapiAuth()

definePageMeta({
  layout: false
})

const user = useStrapiUser()
const router = useRouter()

const onClick = () => {
  window.location = getProviderAuthenticationUrl('github') as unknown as Location
}

onMounted(() => {
  if (user.value) {
    router.push('/dashboard')
  }
})
</script>
