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
    type: Object as PropType<{ title: string, description: string, button; string }>
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
}
</script>

<template>
  <div class="flex">
    <div class="w-full">
      <UCard :ui="{ body: { base: 'flex flex-col space-y-6 w-full', padding: 'px-4 py-5 sm:p-8' } }">
        <UForm :validate="validate" :state="state" @submit="onSubmit" class="space-y-6">
          <UFormGroup :label="form.email.label" name="email" required>
            <UInput v-model="state.email" :placeholder="form.email.placeholder" />
          </UFormGroup>

          <UFormGroup :label="form.help.label" name="help" required>
            <UTextarea autoresize v-model="state.help" :placeholder="form.help.placeholder" rows="10" />
          </UFormGroup>
        </UForm>

        <div class="text-gray-700 dark:text-gray-400" v-html="form.info" />


        <UButton :label="form.button" type="submit" color="gray" class="w-fit pt-2" />
      </UCard>
    </div>

    <UDivider label="OR" color="gray" orientation="vertical" class="w-[20%] py-16" />

    <div class="w-full">
      test
    </div>
  </div>
</template>
