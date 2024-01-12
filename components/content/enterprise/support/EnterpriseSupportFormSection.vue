<script lang="ts" setup>
import type { FormError, FormSubmitEvent } from '#ui/types'

const props = defineProps({
  form: {
    type: Object as PropType<{
      name: { label: string, placeholder: string },
      companyEmail: { label: string, placeholder: string },
      company: { label: string, placeholder: string },
      help: { label: string, placeholder: string }
      info: string,
      button: string
    }
    >,
    default: () => ({})
  },
  call: {
    type: Object as PropType<{ title: string, description: string, button: string }>,
    default: () => ({})
  }
})

const toast = useToast()

const loading = ref<Boolean>(false)
const turnstile = ref()

const state = reactive({
  name: undefined,
  companyEmail: undefined,
  company: undefined,
  help: undefined
})

const validate = (state: any): FormError[] => {
  const errors = []
  if (!state.name) errors.push({ path: 'name', message: 'Required' })
  if (!state.companyEmail) errors.push({ path: 'companyEmail', message: 'Required' })
  if (!state.company) errors.push({ path: 'company', message: 'Required' })
  if (!state.help) errors.push({ path: 'help', message: 'Required' })
  return errors
}

async function onSubmit (event: FormSubmitEvent<any>) {
  if (event.data) {
    if (loading.value) { return }

    loading.value = true

    await $fetch('http://127.0.0.1:3000/api/support/contact', {
      method: 'POST',
      body: {
        name: props.form.name,
        companyEmail: props.form.companyEmail,
        company: props.form.company,
        help: props.form.help
      }
    })
      .then(() => {
        state.company = ''
        state.name = ''
        state.companyEmail = ''
        state.help = ''
        toast.add({ title: 'Email sent', description: 'We will do everything possible to respond to you as quickly as possible', color: 'green' })
      })
      .catch((e) => {
        const description = e.data?.message || 'Something went wrong. Please try again later.'
        toast.add({ title: 'Email sending failed', description, color: 'red' })
      })
      .finally(() => {
        loading.value = false
        //reset turnstile token
        turnstile.value?.reset()
      })
  }
}
</script>

<template>
  <div class="flex flex-col lg:flex-row">
    <div class="w-full">
      <UCard :ui="{ background: 'form-bg', body: { base: 'flex flex-col space-y-6 w-full', padding: 'px-4 py-5 sm:p-8' } }">
        <UForm :validate="validate" :state="state" class="space-y-6" @submit="onSubmit">
          <NuxtTurnstile ref="turnstile" :options="{ action: 'vue' }" />

          <UFormGroup :label="form.name.label" name="name" required>
            <UInput v-model="state.name" :placeholder="form.name.placeholder" />
          </UFormGroup>

          <UFormGroup :label="form.companyEmail.label" name="companyEmail" required>
            <UInput v-model="state.companyEmail" :placeholder="form.companyEmail.placeholder" />
          </UFormGroup>

          <UFormGroup :label="form.company.label" name="company" required>
            <UInput v-model="state.company" :placeholder="form.company.placeholder" />
          </UFormGroup>

          <UFormGroup :label="form.help.label" name="help" required>
            <UTextarea v-model="state.help" autoresize :placeholder="form.help.placeholder" :rows="6" />
          </UFormGroup>

          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="text-gray-700 dark:text-gray-400" v-html="form.info" />

          <UButton :label="form.button" type="submit" color="gray" class="w-fit pt-2" />
        </UForm>
      </UCard>
    </div>

    <UDivider label="OR" color="gray" orientation="vertical" class="hidden lg:flex w-[40%] py-16" :ui="{ label: 'text-xl py-8' }" />
    <UDivider label="OR" color="gray" class="lg:hidden py-16" :ui="{ label: 'text-xl py-8' }" />

    <div class="w-full flex items-start justify-center flex-col">
      <h2 class="text-xl font-bold">
        {{ call.title }}
      </h2>
      <p>
        {{ call.description }}
      </p>
      <UButton class="mt-8" color="gray" :label="call.button" />
    </div>
  </div>
</template>

<style scoped lang="postcss">
.dark .form-bg {
  background: linear-gradient(0deg, rgba(15, 23, 42, 0.50) 0%, rgba(15, 23, 42, 0.50) 100%), linear-gradient(180deg, rgba(51, 65, 85, 0.50) 0%, rgba(2, 4, 32, 0.50) 33.92%) !important;
}
</style>
