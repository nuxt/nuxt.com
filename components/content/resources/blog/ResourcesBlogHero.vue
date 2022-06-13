<template>
  <UContainer padded>
    <div class="grid gap-8 pt-12 pb-8 sm:py-12 lg:grid-cols-2">
      <div class="flex flex-col items-center justify-center sm:items-start gap-y-5">
        <h1 class="text-4xl font-semibold text-center sm:text-left u-text-gray-900 sm:text-5xl">
          <Markdown :use="$slots.title" unwrap="p" />
        </h1>
        <p v-if="$slots.description" class="text-lg font-medium text-center sm:text-left u-text-gray-500">
          <Markdown :use="$slots.description" unwrap="p" />
        </p>
        <form class="flex gap-3" @submit.prevent="onSubmit">
          <UInput
            v-model="form.email"
            name="email"
            placeholder="Enter your email"
            class="w-auto sm:w-64"
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
const { data: firstArticle } = await useAsyncData('resources-blog-hero', () => queryContent('/resources/blog').where({
  $not: {
    _path: {
      $in: ['/resources/blog']
    }
  }
}).sort({ date: 0 }).findOne())

const { $toast } = useNuxtApp()

const form = reactive({
  email: ''
})
const loading = ref(false)

async function onSubmit () {
  loading.value = true

  // TODO: handle already subscribed case
  // FIXME: cannot retry call (uses fetch caching) (waiting for module update)
  const { error } = await useNewsletterSubscribe(form.email)
  if (!error.value) {
    $toast.success({ title: 'Subscription succeed', description: 'You have been successfully subscribed to Nuxt newsletter. Please check your emails to confirm your subscription.' })
  } else {
    $toast.error({ title: 'Subscription failed', description: 'Something went wrong. Please try again later.' })
  }

  loading.value = false
}
</script>
