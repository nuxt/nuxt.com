<template>
  <div class="relative">
    <UContainer padded class="flex flex-col items-center py-12">
      <Markdown :use="$slots.header" unwrap="p" />
      <div class="py-8 font-semibold text-center text-7xl">
        <Markdown :use="$slots.title" unwrap="p" />
      </div>
      <div class="w-1/2 text-lg font-medium text-center text-gray-500">
        <Markdown :use="$slots.description" unwrap="p" />
      </div>
      <form class="flex gap-3 py-12" @submit.prevent="onSubmit">
        <UInput
          v-model="form.email"
          name="email"
          placeholder="Subscribe to our newsletter"
          class="w-72"
          size="md"
          required
        />
        <UButton
          type="submit"
          submit
          variant="primary"
          :loading="loading"
          label="Submit"
          size="md"
        />
      </form>
    </UContainer>
    <div class="absolute left-0 inset-y-1/2">
      <img src="/assets/projects/gems.svg" class="">
    </div>
  </div>
</template>

<script setup lang="ts">
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
