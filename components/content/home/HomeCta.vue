<template>
  <div class="relative py-8 pb-48 ">
    <img src="/assets/home/gradient-cta.svg" class="absolute w-full h-full bottom-24 -left-8">
    <UContainer padded class="relative flex flex-col items-center justify-center gap-y-6">
      <h3 class="text-4xl font-semibold u-text-gray-900">
        <Markdown :use="$slots.title" unwramp="p" />
      </h3>
      <p class="max-w-xl text-xl text-center u-text-gray-600">
        <Markdown :use="$slots.description" unwramp="p" />
      </p>
      <form class="flex flex-wrap justify-start justify-center w-full gap-6 sm:flex-nowrap" @submit.prevent="onSubmit">
        <UInput
          v-model="form.email"
          name="email"
          placeholder="Enter your email"
          class="w-full sm:w-64"
          size="lg"
          required
        />
        <UButton
          type="submit"
          submit
          variant="primary-gradient"
          :loading="loading"
          :label="buttonText"
          size="lg"
        />
      </form>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
defineProps({
  buttonText: {
    type: String,
    default: ''
  }
})

const { $toast } = useNuxtApp()

const form = reactive({
  email: ''
})
const loading = ref(false)

async function onSubmit () {
  loading.value = true

  // TODO: handle already subscribed case
  // FIXME: cannot retry call (uses fetch caching) (waiting for module update)
  const { error } = await useNewsletterSubscribe(form.email)
  if (!error.value) {
    $toast.success({ title: 'Subscription succeed', description: 'You have been successfully subscribed to Nuxt newsletter. Please check your emails to confirm your subscription.' })
  } else {
    $toast.error({ title: 'Subscription failed', description: 'Something went wrong. Please try again later.' })
  }

  loading.value = false
}
</script>
