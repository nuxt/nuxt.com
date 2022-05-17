<template>
  <UCard body-class="grid grid-cols-2 gap-8 p-10" class="backdrop-blur-lg !bg-opacity-10" @submit.prevent="onSubmit">
    <UFormGroup name="email" label="Your company email">
      <UInput
        v-model="form.email"
        name="email"
        type="email"
        required
        placeholder="johndoo@company.com"
        autocomplete="off"
      />
    </UFormGroup>

    <UFormGroup name="name" label="Your name">
      <UInput
        v-model="form.name"
        name="name"
        required
        placeholder="John Doo"
        autocomplete="off"
      />
    </UFormGroup>

    <UFormGroup name="website" label="Company website">
      <UInput
        v-model="form.website"
        name="website"
        required
        placeholder="nuxt.com"
        autocomplete="off"
      />
    </UFormGroup>

    <UFormGroup name="companySize" label="Company size">
      <USelect
        v-model="form.companySize"
        name="companySize"
        :options="companySizes"
        required
      />
    </UFormGroup>

    <UFormGroup name="message" label="Tell us about your needs" class="col-span-2">
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
        label="Contact"
      />
    </div>
  </UCard>
</template>

<script setup lang="ts">
const form = reactive({ email: '', name: '', website: '', companySize: '', message: '' })
const loading = ref(false)

const companySizes = [
  { text: '1-10', value: '1-10' },
  { text: '10-100', value: '10-100' },
  { text: '100+', value: '100+' }
]

async function onSubmit () {
  loading.value = true

  // TODO: send request
  await new Promise(function (resolve) { setTimeout(resolve, 1000) })

  loading.value = false
}
</script>
