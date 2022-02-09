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
          Sign up to Nuxt
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Already have an account?
          {{ ' ' }}
          <NuxtLink to="/login" class="font-medium text-gray-800 hover:underline">
            Log in
          </NuxtLink>
        </p>
      </div>

      <UCard custom-class="mt-8" body-class="px-4 py-5 sm:px-6 space-y-6" padded @submit.prevent="onSubmit">
        <div class="rounded-md shadow-sm -space-y-px mx-auto">
          <div>
            <label for="email" class="sr-only">Email address</label>
            <UInput
              v-model="form.email"
              name="email"
              type="email"
              required
              autofocus
              placeholder="Email address"
              custom-class="relative focus:z-10 !rounded-b-none"
              size="lg"
            />
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <UInput
              v-model="form.password"
              name="password"
              type="password"
              required
              placeholder="Password"
              custom-class="relative focus:z-10 !rounded-none"
              size="lg"
            />
          </div>
          <div>
            <label for="passwordConfirmation" class="sr-only">Password confirmation</label>
            <UInput
              v-model="passwordConfirmation"
              name="passwordConfirmation"
              type="password"
              required
              placeholder="Confirm password"
              custom-class="relative focus:z-10 !rounded-t-none"
              size="lg"
            />
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <UCheckbox v-model="termsAccepted" name="terms" required>
              <template #label>
                By signing up you agree to our
                <NuxtLink to="/terms" class="font-bold hover:underline">
                  Terms of service
                </NuxtLink>
              </template>
            </UCheckbox>
          </div>
        </div>

        <div>
          <UButton
            :loading="loading"
            type="submit"
            icon="heroicons-outline:arrow-right"
            trailing
            size="lg"
            label="Sign up"
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

const { register } = useStrapiAuth()
const router = useRouter()

const loading = ref(false)
const form = reactive({ email: '', password: '' })
const passwordConfirmation = ref('')
const termsAccepted = ref(false)

const onSubmit = async () => {
  loading.value = true

  try {
    await register(form)

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
