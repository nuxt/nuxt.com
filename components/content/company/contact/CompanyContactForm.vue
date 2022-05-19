<template>
  <UCard body-class="grid grid-cols-2 gap-8 p-10" class="backdrop-blur-lg !bg-opacity-10" @submit.prevent="onSubmit">
    <UFormGroup name="firstname" label="First name">
      <UInput
        v-model="form.firstname"
        name="firstname"
        required
        placeholder="John"
        autocomplete="off"
      />
    </UFormGroup>

    <UFormGroup name="lastname" label="Last name">
      <UInput
        v-model="form.lastname"
        name="lastname"
        required
        placeholder="Doo"
        autocomplete="off"
      />
    </UFormGroup>

    <UFormGroup name="website" label="Your Nuxt website">
      <UInput
        v-model="form.website"
        name="website"
        required
        placeholder="nuxt.com"
        autocomplete="off"
      />
    </UFormGroup>

    <UFormGroup name="email" label="Email">
      <UInput
        v-model="form.email"
        name="email"
        type="email"
        required
        placeholder="johndoo@company.com"
        autocomplete="off"
      />
    </UFormGroup>

    <UFormGroup name="subject" label="What do you need help with?" class="col-span-2">
      <USelect
        v-model="form.subject"
        name="subject"
        :options="helpOptions"
        required
      />
    </UFormGroup>

    <UFormGroup name="message" label="Your message" help="Please describe us you issue in detail so we can help you in better ways." class="col-span-2">
      <UTextarea
        v-model="form.message"
        name="message"
        required
        autocomplete="off"
        :rows="4"
        :autoresize="true"
      />
    </UFormGroup>

    <div class="flex items-center justify-center col-span-2">
      <UButton
        type="submit"
        :loading="loading"
        label="Contact us"
      />
    </div>
  </UCard>
</template>

<script setup lang="ts">
const { $toast } = useNuxtApp()

const initialForm = { firstname: '', lastname: '', website: '', email: '', subject: '', message: '' }
const form = reactive({ ...initialForm })
const loading = ref(false)

const helpOptions = [
  { text: 'Something', value: 'something' },
  { text: 'Something else', value: 'something-else' },
  { text: 'Other', value: 'other' }
]

async function onSubmit () {
  loading.value = true

  try {
    await $fetch('/api/email/contact', {
      method: 'POST',
      body: form
    })

    Object.assign(form, initialForm)

    $toast.success({
      title: 'Contact request success',
      description: 'Your request has been sent. We will come back to you.'
    })
  } catch (e) {}

  loading.value = false
}
</script>
