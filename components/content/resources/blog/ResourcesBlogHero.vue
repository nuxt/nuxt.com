<template>
  <UContainer padded>
    <div class="grid grid-cols-2 gap-8 py-12 md:py-20">
      <div class="flex flex-col justify-center">
        <h1 class="text-4xl font-semibold tracking-tight u-text-gray-900 sm:text-5xl">
          <Markdown use="title" unwrap="p" />
        </h1>
        <p v-if="$slots.description" class="mt-6 text-lg font-medium u-text-gray-500">
          <Markdown use="description" unwrap="p" />
        </p>
        <form class="flex gap-3 mt-6" @submit.prevent="onSubmit">
          <UInput
            v-model="form.email"
            name="email"
            placeholder="Enter your email"
            class="w-72"
            size="sm"
            required
          />
          <UButton
            type="submit"
            submit
            variant="primary"
            :loading="loading"
            label="Subscribe"
            size="xs"
          />
        </form>
      </div>
      <ResourcesBlogPostHighlighted :page="firstArticle" />
    </div>
  </UContainer>
</template>

<script setup lang="ts">
const { data: firstArticle } = await useAsyncData('resources-blog-hero', () => queryContent('/resources/blog').where({ $not: { path: { $in: ['/resources/blog'] } } }).sortBy('date', 'desc').findOne())

const { $toast } = useNuxtApp()

const form = reactive({
  email: ''
})
const loading = ref(false)

async function onSubmit () {
  loading.value = true

  const { error } = await useNewsletterSubscribe(form.email)
  if (!error.value) {
    $toast.success({ title: 'Newsletter subscription', description: 'You have been successfully subscribed to Nuxt newsletter.' })
  } else {
    $toast.error({ title: 'Newsletter subscription', description: 'Something went wrong. Please try again later.' })
  }

  loading.value = false
}
</script>
