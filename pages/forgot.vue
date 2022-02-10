<template>
  <div class="h-full min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <NuxtLink to="/login">
          <Logo class="h-12 mx-auto u-text-black" />
        </NuxtLink>
      </div>

      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold u-text-gray-900">
          Forgot your password?
        </h2>
        <p class="mt-2 text-center text-sm u-text-gray-600">
          Enter your email, you will have all instructions to change your password.
        </p>
      </div>

      <UCard custom-class="mt-8" body-class="px-4 py-5 sm:px-6 space-y-6" padded @submit.prevent="onSubmit">
        <UFormGroup name="email" label="Email address">
          <UInput
            v-model="form.email"
            name="email"
            type="email"
            required
            autofocus
            placeholder="Email address"
            size="lg"
          />
        </UFormGroup>

        <div>
          <UButton
            :loading="loading"
            type="submit"
            icon="heroicons-outline:arrow-right"
            trailing
            size="lg"
            label="Send me a reset link"
            block
          />
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const { $toast } = useNuxtApp()
const { forgotPassword } = useStrapiAuth()
const router = useRouter()
const route = useRoute()

const loading = ref(false)
const form = reactive({ email: '' })

onMounted(() => {
  if (route.query.email) {
    form.email = route.query.email as string
  }
})

const onSubmit = async () => {
  loading.value = true

  try {
    await forgotPassword(form)

    router.push('/login')

    $toast.success({ title: 'Successfully sent!', description: 'You will receive an email with the reset link.' })
  } catch (e) { }

  loading.value = false
}
</script>
