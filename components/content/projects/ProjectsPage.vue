<template>
  <div class="relative">
    <div class="absolute left-0 inset-y-1/3">
      <img src="/assets/projects/gems.svg" class="opacity-25 lg:opacity-100">
    </div>
    <UContainer padded class="relative flex flex-col items-center pt-8 pb-16 sm:pb-32">
      <div class="flex flex-col items-center justify-center gap-2 sm:gap-4 sm:flex-row">
        <UBadge
          variant="indigo"
          base-class="inline-flex items-center font-semibold border bg-indigoblue-50 border-indigoblue-400 dark:bg-black text-indigoblue-700 dark:text-white"
          size="lg"
        >
          <Markdown :use="$slots.badge" unwrap="p" />
        </UBadge>
        <div class="text-center text-gray-500 dark:text-gray-100">
          <Markdown :use="$slots.header" unwrap="p" />
        </div>
      </div>

      <div class="py-8 text-5xl font-semibold leading-tight text-center sm:text-6xl md:text-7xl">
        <Markdown :use="$slots.title" unwrap="p" />
      </div>
      <div class="text-lg font-medium leading-relaxed text-center text-gray-500 dark:text-gray-100 sm:w-1/2">
        <Markdown :use="$slots.description" unwrap="p" />
      </div>
      <form class="flex flex-wrap gap-3 pt-12 pb-16" @submit.prevent="onSubmit">
        <UInput
          v-model="form.email"
          name="email"
          placeholder="Subscribe to our newsletter"
          class="w-72"
          size="md"
          required
        />
        <UButton
          type="submit"
          submit
          variant="primary"
          :loading="loading"
          label="Submit"
          size="md"
        />
      </form>
      <div class="w-full overflow-hidden rounded-xl">
        <YoutubePlayer :video-id="videoId" :title="videoTitle" />
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
defineProps({
  videoId: {
    type: String,
    default: ''
  },
  videoTitle: {
    type: String,
    default: ''
  }
})

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
