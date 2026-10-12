<script setup lang="ts">
import * as v from 'valibot'
import type { FormSubmitEvent } from '#ui/types'

const {
  label = 'Subscribe to our newsletter',
  description = 'Stay updated on new releases and features, guides, and community updates.',
  size = 'lg'
} = defineProps<{
  label?: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
}>()

const toast = useToast()
const { track } = useAnalytics()

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
    track('Newsletter Subscription', { success: true })
    toast.add({ title: 'Subscription pending', description: 'Please check your emails to confirm your subscription.', color: 'success' })
    state.email = ''
  }).catch((err) => {
    track('Newsletter Subscription', { success: false })
    const description = err.data?.message || 'Something went wrong. Please try again later.'
    toast.add({ title: 'Subscription failed', description, color: 'error' })
  })
  loading.value = false
}
</script>

<template>
  <UForm :schema="schema" :state="state" :validate-on="[]" class="block" @submit="onSubmit">
    <UFormField name="email" :label="label" :size="size" :description="description" :ui="{ label: 'font-semibold', container: label ? 'mt-3' : '' }">
      <UFieldGroup :size="size" class="max-w-sm w-full">
        <UInput
          v-model="state.email"
          type="email"
          placeholder="you@domain.com"
          required
          autocomplete="off"
          class="min-w-0 flex-1"
        />
        <UButton type="submit" color="neutral" :label="loading ? 'Subscribing' : 'Subscribe'" :loading="loading" />
      </UFieldGroup>
    </UFormField>
  </UForm>
</template>
