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
          Sign up to Nuxt
        </h2>
        <p class="mt-2 text-center text-sm u-text-gray-600">
          Already have an account?
          {{ ' ' }}
          <NuxtLink to="/login" class="font-medium u-text-gray-800 hover:underline">
            Log in
          </NuxtLink>
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
        <UFormGroup name="password" label="Password">
          <UInput
            v-model="form.password"
            name="password"
            type="password"
            required
            placeholder="Password"
            size="lg"
            @change="validatePassword"
          />
        </UFormGroup>
        <UFormGroup name="passwordConfirmation" label="Password confirmation">
          <UInput
            ref="passwordConfirmation"
            v-model="passwordConfirmationValue"
            name="passwordConfirmation"
            type="password"
            required
            placeholder="Confirm password"
            size="lg"
            @keyup="validatePassword"
          />
        </UFormGroup>

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

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t u-border-gray-300" />
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 u-bg-white u-text-gray-500"> Or continue with </span>
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
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const { $toast } = useNuxtApp()
const { getProviderAuthenticationUrl } = useStrapiAuth()
const { register } = useStrapiAuth()
const router = useRouter()

const passwordConfirmation = ref(null)
const loading = ref(false)
const form = reactive({ email: '', password: '' })
const passwordConfirmationValue = ref('')
const termsAccepted = ref(false)

const onClick = () => {
  window.location = getProviderAuthenticationUrl('github') as unknown as Location
}

const onSubmit = async () => {
  loading.value = true

  try {
    await register(form)

    $toast.success({ title: 'Your account has been created', description: 'You will need to verify your email address before you can log in.', timeout: 0 })

    router.push('/login')
  } catch (e) { }

  loading.value = false
}

const validatePassword = () => {
  if (form.password !== passwordConfirmationValue.value) {
    passwordConfirmation.value?.input?.setCustomValidity("Passwords don't match.")
  } else {
    passwordConfirmation.value?.input?.setCustomValidity('')
  }
}
</script>
