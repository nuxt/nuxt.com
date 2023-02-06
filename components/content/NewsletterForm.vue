<script setup lang="ts">
defineProps({
  buttonText: {
    type: String,
    default: 'Subscribe'
  }
})

const { $toast } = useNuxtApp()

const email = ref('')
const loading = ref(false)

function onSubmit () {
  if (loading.value) { return }
  loading.value = true

  $fetch('/api/newsletter/subscribe', {
    method: 'POST',
    body: { email: email.value }
  }).then(() => {
    $toast.success({ title: 'Subscription pending', description: 'Please check your emails to confirm your subscription.' })
    email.value = ''
  }).catch((err) => {
    const description = err.data?.message || 'Something went wrong. Please try again later.'
    $toast.error({ title: 'Subscription failed', description })
  }).finally(() => {
    loading.value = false
  })
}
</script>

<template>
  <form class="flex flex-col gap-y-4 mt-6" @submit.prevent="onSubmit">
    <ContentSlot :use="$slots.default" unwrap="p" />
    <div class="flex gap-x-2 items-center">
      <UInput
        v-model="email"
        name="email"
        placeholder="Email"
        class="w-full sm:w-64"
        size="lg"
        required
      />
      <AppButton
        type="submit"
        submit
        variant="primary-gradient"
        :loading="loading"
        :label="buttonText"
        class="focus-visible:ring-2"
      />
    </div>
  </form>
</template>

<style scoped lang="postcss">
button[type="submit"]{
 @apply border-gradient-br-gradient-black;
}
</style>
