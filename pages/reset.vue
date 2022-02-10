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
          Reset your password
        </h2>
        <p class="mt-2 text-center text-sm u-text-gray-600">
          Enter a new password to login to your account.
        </p>
      </div>

      <UCard custom-class="mt-8" body-class="px-4 py-5 sm:px-6 space-y-6" padded @submit.prevent="onSubmit">
        <UFormGroup name="password" label="Password">
          <UInput
            v-model="form.password"
            name="password"
            type="password"
            required
            placeholder="Password"
            size="lg"
            autofocus
          />
        </UFormGroup>
        <UFormGroup name="passwordConfirmation" label="Password confirmation">
          <UInput
            v-model="form.passwordConfirmation"
            name="passwordConfirmation"
            type="password"
            required
            placeholder="Confirm password"
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
            label="Reset my password"
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

const { resetPassword } = useStrapiAuth()
const router = useRouter()
const route = useRoute()

const loading = ref(false)
const form = reactive({ password: '', passwordConfirmation: '' })

const onSubmit = async () => {
  loading.value = true

  try {
    await resetPassword({ ...form, code: route.query.code as string })

    const redirect = useCookie('redirect').value
    if (redirect) {
      router.push(redirect)
      useCookie('redirect').value = null
    } else {
      router.push('/dashboard')
    }
  } catch (e) { }

  loading.value = false
}
</script>
