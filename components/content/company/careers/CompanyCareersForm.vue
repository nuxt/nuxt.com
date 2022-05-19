<template>
  <UCard
    background-class="u-bg-gray-50"
    border-color-class=""
    ring-class=""
    shadow-class=""
    body-class="grid grid-cols-2 gap-8 py-10 px-28"
    header-class="pt-12 border-none sm:px-6"
    @submit.prevent="onSubmit"
  >
    <template #header>
      <h2 class="flex justify-center text-4xl font-semibold u-text-gray-900">
        Contact Us
      </h2>
    </template>

    <UFormGroup name="firstname" label="First Name">
      <UInput
        v-model="form.firstname"
        name="firstname"
        required
        placeholder="John"
        autocomplete="off"
        size="xl"
        appearance="darken"
      />
    </UFormGroup>

    <UFormGroup name="lastname" label="Last Name">
      <UInput
        v-model="form.lastname"
        name="lastname"
        required
        placeholder="Doe"
        autocomplete="off"
        size="xl"
        appearance="darken"
      />
    </UFormGroup>

    <UFormGroup name="company" label="Company" class="col-span-2">
      <UInput
        v-model="form.company"
        name="company"
        required
        placeholder="NuxtLabs"
        autocomplete="off"
        size="xl"
        appearance="darken"
      />
    </UFormGroup>

    <UFormGroup name="email" label="Email" class="col-span-2">
      <UInput
        v-model="form.email"
        name="email"
        type="email"
        required
        placeholder="johndoe@company.com"
        autocomplete="off"
        size="xl"
        appearance="darken"
      />
    </UFormGroup>

    <UFormGroup name="message" label="Message" class="col-span-2">
      <UTextarea
        v-model="form.message"
        name="message"
        required
        autocomplete="off"
        :rows="4"
        :autoresize="true"
        appearance="darken"
      />
    </UFormGroup>

    <div class="flex items-center justify-center col-span-2">
      <UButton
        type="submit"
        :loading="loading"
        label="Let's talk"
        size="xl"
      />
    </div>
  </UCard>
</template>

<script setup lang="ts">
const props = defineProps({
  offer: {
    type: String,
    required: true
  }
})

const { $toast } = useNuxtApp()

const initialForm = { firstname: '', lastname: '', company: '', email: '', offer: props.offer, message: '' }
const form = reactive({ ...initialForm })
const loading = ref(false)

async function onSubmit () {
  loading.value = true

  try {
    await $fetch('/api/email/career', {
      method: 'POST',
      body: form
    })

    Object.assign(form, initialForm)

    $toast.success({
      title: 'Application success',
      description: 'Your application has been sent. We will come back to you.'
    })
  } catch (e) {}

  loading.value = false
}
</script>
