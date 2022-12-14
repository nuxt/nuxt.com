<template>
  <DocsHero class="mb-6" :image="image">
    <template #title>
      <ContentSlot :use="$slots.title" unwrap="p" />
    </template>
    <template #description>
      <ContentSlot :use="$slots.description" unwrap="p" />
    </template>

    <template #extra>
      <form class="flex flex-col sm:flex-row gap-3 items-start justify-center md:justify-start sm:items-center" @submit.prevent="onSubmit">
        <UInput
          v-model="email"
          name="email"
          placeholder="Email"
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
          class="focus-visible:ring-2"
        />
      </form>
    </template>
  </DocsHero>
</template>

<script setup lang="ts">
defineProps({
  image: {
    type: Object,
    default: () => {}
  },
  buttonText: {
    type: String,
    default: 'Subscribe'
  }
})

const { $toast } = useNuxtApp()

const email = ref('')
const loading = ref(false)

async function onSubmit () {
  loading.value = true

  const { status } = await useNewsletterSubscribe(email.value)
  if (status === 200) {
    $toast.success({ title: 'Subscription succeed', description: 'You have been successfully subscribed to Nuxt newsletter. Please check your emails to confirm your subscription.' })
    email.value = ''
  } else {
    const description = 'Something went wrong. Please try again later.'
    $toast.error({ title: 'Subscription failed', description })
  }

  loading.value = false
}
</script>
