<template>
  <UContainer padded>
    <div class="grid gap-8 pt-12 pb-8 sm:py-12 lg:grid-cols-2">
      <div class="flex flex-col items-center justify-center sm:items-start gap-y-2 sm:gap-y-5">
        <h1 class="text-4xl font-semibold text-center sm:text-left u-text-gray-900 sm:text-5xl">
          <ContentSlot :use="$slots.title" unwrap="p" />
        </h1>
        <p v-if="$slots.description" class="text-lg font-medium text-center sm:text-left u-text-gray-500">
          <ContentSlot :use="$slots.description" unwrap="p" />
        </p>
        <form class="flex flex-wrap justify-center w-full gap-6 sm:flex-nowrap sm:items-center sm:justify-start" @submit.prevent="onSubmit">
          <UInput
            v-model="form.email"
            name="email"
            placeholder="Enter your email"
            class="w-full sm:w-64"
            size="lg"
            required
          />
          <UButton
            type="submit"
            submit
            variant="primary-gradient"
            :loading="loading"
            label="Subscribe"
            size="lg"
          />
        </form>
      </div>
      <ResourcesBlogPostHighlighted v-if="firstArticle" :page="firstArticle" />
    </div>
  </UContainer>
</template>

<script setup lang="ts">
const { data: firstArticle } = await useAsyncData('resources-blog-hero', () => queryContent().where({
  _path: /^\/resources\/blog\//
}).sort({ date: -1 }).findOne())

const { $toast } = useNuxtApp()

const form = reactive({
  email: ''
})
const loading = ref(false)

async function onSubmit () {
  loading.value = true

  const { error } = await useNewsletterSubscribe(form.email)
  if (!error) {
    $toast.success({ title: 'Subscription succeed', description: 'You have been successfully subscribed to Nuxt newsletter. Please check your emails to confirm your subscription.' })
  } else {
    let description = 'Something went wrong. Please try again later.'
    const errors = Object.values(error)
    if (errors.length && errors[0]?.length) {
      description = errors[0][0]
    }
    $toast.error({ title: 'Subscription failed', description })
  }

  loading.value = false
}
</script>
