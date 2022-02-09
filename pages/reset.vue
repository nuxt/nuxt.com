<template>
  <div class="h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <NuxtLink to="/">
          <Logo class="h-12 mx-auto text-black" />
        </NuxtLink>
      </div>

      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Reset your password
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Enter a new password to login to your account.
        </p>
      </div>

      <UCard custom-class="mt-8" body-class="px-4 py-5 sm:px-6 space-y-6" padded @submit.prevent="onSubmit">
        <div class="rounded-md shadow-sm -space-y-px mx-auto">
          <div>
            <label for="password" class="sr-only">Password</label>
            <UInput
              v-model="form.password"
              name="password"
              type="password"
              required
              placeholder="Password"
              custom-class="relative focus:z-10 !rounded-b-none"
              size="lg"
              autofocus
            />
          </div>
          <div>
            <label for="passwordConfirmation" class="sr-only">Password confirmation</label>
            <UInput
              v-model="form.passwordConfirmation"
              name="passwordConfirmation"
              type="password"
              required
              placeholder="Confirm password"
              custom-class="relative focus:z-10 !rounded-t-none"
              size="lg"
            />
          </div>
        </div>

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
    await resetPassword({ ...form, code: route.query.code })

    const redirect = useCookie('redirect').value
    if (redirect) {
      router.push(redirect)
      useCookie('redirect').value = null
    } else {
      router.push('/login')
    }
  } catch (e) { }

  loading.value = false
}
</script>
