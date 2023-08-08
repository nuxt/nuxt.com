<script setup lang="ts">
defineProps({
  label: {
    type: String,
    default: 'Subscribe to our newsletter'
  }
})

const toast = useToast()

const email = ref('')
const loading = ref(false)

function onSubmit () {
  if (loading.value) { return }
  loading.value = true

  $fetch('/api/newsletter/subscribe', {
    method: 'POST',
    body: { email: email.value }
  }).then(() => {
    toast.add({ title: 'Subscription pending', description: 'Please check your emails to confirm your subscription.', color: 'green' })
    email.value = ''
  }).catch((err) => {
    const description = err.data?.message || 'Something went wrong. Please try again later.'
    toast.add({ title: 'Subscription failed', description, color: 'red' })
  }).finally(() => {
    loading.value = false
  })
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <UFormGroup name="email" :label="label" size="xl" :ui="{ label: { base: 'block font-semibold text-foreground' } }">
      <UInput type="email" placeholder="you@domain.com" :ui="{ icon: { trailing: { pointer: '' } } }" required autocomplete="off">
        <template #trailing>
          <UButton type="submit" size="xs" color="black">
            Subscribe
          </UButton>
        </template>
      </UInput>
    </UFormGroup>
  </form>
</template>
