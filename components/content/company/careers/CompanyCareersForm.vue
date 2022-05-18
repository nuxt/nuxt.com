<template>
  <UCard
    background-class="u-bg-gray-50"
    border-color-class="border-none"
    rounded-class="rounded-xl"
    ring-class=""
    shadow-class=""
    body-class="grid grid-cols-2 gap-8 py-10 px-28"
    header-class="pt-12 border-none sm:px-6"
    @submit.prevent="onSubmit"
  >
    <template #header>
      <h2 class="flex justify-center text-4xl font-bold u-text-gray-900">
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
const form = reactive({ firstname: '', lastname: '', company: '', email: '', message: '' })
const loading = ref(false)

async function onSubmit () {
  loading.value = true

  // TODO call api/contact when ready
  await new Promise(function (resolve) { setTimeout(resolve, 1000) })

  loading.value = false
}
</script>
