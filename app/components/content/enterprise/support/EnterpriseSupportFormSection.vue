<script lang="ts" setup>
interface NuxtTurnstile {
  reset: () => void
}
import * as v from 'valibot'
import type { FormSubmitEvent } from '#ui/types'

const formProps = defineProps<{
  form: {
    name: { label: string, placeholder: string }
    email: { label: string, placeholder: string }
    company: { label: string, placeholder: string }
    body: { label: string, placeholder: string }
    info: string
    button: any
  }
}>()

const toast = useToast()

const loading = ref<boolean>(false)
const turnstile = useTemplateRef<NuxtTurnstile>('turnstile')
const token = ref()

const schema = v.object({
  name: v.pipe(v.string(), v.minLength(1, 'Name is required')),
  email: v.pipe(
    v.string(),
    v.minLength(1, 'Email is required'),
    v.email('Please enter a valid email')
  ),
  company: v.pipe(v.string(), v.minLength(1, 'Company is required')),
  body: v.pipe(v.string(), v.minLength(1, 'Message is required'))
})

type Schema = v.InferOutput<typeof schema>

const state = reactive({
  name: '',
  email: '',
  company: '',
  body: ''
})

const showTurnstile = ref(false)
const canSend = computed(() => {
  return Boolean(state.name && state.email && state.company && state.body && token.value)
})

watch([() => state.name, () => state.email, () => state.company, () => state.body],
  () => {
    if (state.name && state.email && state.company && state.body) {
      showTurnstile.value = true
    }
  },
  { immediate: true }
)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!event.data) return
  if (loading.value || !canSend.value) return

  loading.value = true

  await $fetch('https://api.nuxt.com/support/contact', {
    method: 'POST',
    body: {
      ...event.data,
      token: token.value
    }
  })
    .then(() => {
      state.name = ''
      state.email = ''
      state.company = ''
      state.body = ''
      showTurnstile.value = false
      toast.add({ title: 'Email sent', description: 'We will do everything possible to respond to you as quickly as possible', color: 'success' })
    })
    .catch((e) => {
      const description = e.data?.message || 'Something went wrong. Please try again later.'
      toast.add({ title: 'Email sending failed', description, color: 'error' })
    })
    .finally(() => {
      loading.value = false
      // reset turnstile token
      turnstile.value?.reset()
    })
}
</script>

<template>
  <div class="w-full max-w-[640px]">
    <UPageCard>
      <UForm :schema="v.safeParser(schema)" :state="state" class="space-y-6" @submit="onSubmit">
        <UFormField :label="formProps.form.name.label" name="name" required>
          <UInput v-model="state.name" :placeholder="formProps.form.name.placeholder" class="w-full" />
        </UFormField>

        <UFormField :label="formProps.form.email.label" name="email" required>
          <UInput v-model="state.email" type="email" :placeholder="formProps.form.email.placeholder" class="w-full" />
        </UFormField>

        <UFormField :label="formProps.form.company.label" name="company" required>
          <UInput v-model="state.company" :placeholder="formProps.form.company.placeholder" class="w-full" />
        </UFormField>

        <UFormField :label="formProps.form.body.label" name="body" required>
          <UTextarea v-model="state.body" autoresize :placeholder="formProps.form.body.placeholder" :rows="6" class="w-full" />
        </UFormField>

        <ClientOnly>
          <NuxtTurnstile v-if="showTurnstile" ref="turnstile" v-model="token" :options="{ theme: $colorMode.value as 'auto' | 'light' | 'dark' }" />
        </ClientOnly>

        <div class="flex justify-end">
          <UButton
            v-bind="formProps.form.button"
            type="submit"
            color="neutral"
            class="w-fit pt-2"
            :loading="loading"
            :disabled="!canSend"
          />
        </div>
      </UForm>
    </UPageCard>
  </div>
</template>
