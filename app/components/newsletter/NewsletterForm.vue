<script setup lang="ts">
import * as v from 'valibot'
import type { FormSubmitEvent } from '#ui/types'

const {
  label = 'Subscribe to our newsletter',
  description = 'Stay updated on new releases and features, guides, and community updates.'
} = defineProps<{
  label?: string
  description?: string
}>()

const toast = useToast()

const loading = ref(false)

const schema = v.object({
  email: v.pipe(v.string(), v.email('Please enter a valid email'))
})

type Schema = v.InferOutput<typeof schema>

const state = reactive({
  email: ''
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true

  await $fetch('/api/newsletter/subscribe', {
    method: 'POST',
    body: {
      email: event.data.email
    }
  }).then(() => {
    toast.add({ title: 'Subscription pending', description: 'Please check your emails to confirm your subscription.', color: 'success' })
    state.email = ''
  }).catch((err) => {
    const error = JSON.parse(err.data?.message)
    const description = error[0].message || 'Something went wrong. Please try again later.'
    toast.add({ title: 'Subscription failed', description, color: 'error' })
  })
  loading.value = false
}
</script>

<template>
  <UForm :schema="schema" :state="state" @submit="onSubmit">
    <UFormField name="email" :label="label" size="lg" :description="description" :ui="{ label: 'font-semibold', container: 'mt-3' }">
      <UInput
        v-model="state.email"
        type="email"
        placeholder="you@domain.com"
        required
        autocomplete="off"
        class="max-w-sm w-full"
      >
        <template #trailing>
          <UButton type="submit" size="xs" color="neutral" :label="loading ? 'Subscribing' : 'Subscribe'" :loading="loading" />
        </template>
      </UInput>
    </UFormField>
  </UForm>
</template>
