<script lang="ts" setup>
import type { FormError, FormSubmitEvent } from '#ui/types'

const props = defineProps({
  form: {
    type: Object as PropType<{
      email: { label: string, placeholder: string },
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

const state = reactive({
  email: undefined,
  help: undefined
})

const validate = (state: any): FormError[] => {
  const errors = []
  if (!state.email) errors.push({ path: 'email', message: 'Required' })
  if (!state.help) errors.push({ path: 'help', message: 'Required' })
  return errors
}

async function onSubmit (event: FormSubmitEvent<any>) {
  console.log(event.data)
  if (event.data) {
    await $fetch('http://localhost:3000/api/support/contact', {
      method: 'POST',
      body: { email: props.form.email, message: props.form.help }
    })
      .then((res) => {
        console.log('res', res)
        //sendingForm.value = false
        //Object.assign(form, initialForm)
        //step.value = 'success'
        //error.value = ''
      })
      .catch((e) => {
        console.log('e', e)
        // error.value = e.message
      })
      .finally(() => {
        // loading.value = false
      })
  }
}
</script>

<template>
  <div class="flex flex-col lg:flex-row">
    <div class="w-full">
      <UCard :ui="{ background: 'form-bg', body: { base: 'flex flex-col space-y-6 w-full', padding: 'px-4 py-5 sm:p-8' } }">
        <UForm :validate="validate" :state="state" class="space-y-6" @submit="onSubmit">
          <UFormGroup :label="form.email.label" name="email" required>
            <UInput v-model="state.email" :placeholder="form.email.placeholder" />
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
