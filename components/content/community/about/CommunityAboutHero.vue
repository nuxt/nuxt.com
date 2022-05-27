<template>
  <PageHero>
    <template #title>
      <Markdown :use="$slots.title" unwrap="p" />
    </template>
    <template #description>
      <Markdown :use="$slots.description" unwrap="p" />
    </template>

    <template #extra>
      <form class="flex gap-3 pt-4" @submit.prevent="onSubmit">
        <UButton
          variant="transparent"
          to="#"
          size="lg"
          base-class="relative flex justify-center overflow-hidden bg-gray-900 border-none dark:hover:overflow-visible rounded-xl group gradient-border"
        >
          <div
            class="absolute w-full h-full bg-gradient-to-r from-green-400 via-teal-400 to-indigoblue-600 dark:from-green-600 dark:via-teal-600 darker:top-indigo-blue-600

            group-hover:blur-[20px] group-hover:top-4 top-8 blur-xl
            dark:blur-[20px] dark:top-4 dark:group-hover:blur-[6px] dark:group-hover:top-0"
          />
          <span class="px-2 py-1 z-[1] text-white">Hello community</span>
        </UButton>

        <UButton
          label="good bye community"
          variant="secondary"
          to="#"
          size="xl"
          custom-class="rounded-xl"
        />
      </form>
    </template>

    <template #background>
      <img src="/assets/community/about/map.png" class="h-full opacity-30 sm:opacity-100">
    </template>
  </PageHero>
</template>

<script setup lang="ts">
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

<style scoped>
.gradient-border {
  border: none;
}
@media (prefers-color-scheme: dark) {
  .gradient-border {
  position: relative;
  border-radius: 12px;
  }
  .gradient-border::before {
    background: linear-gradient(90deg, #303030 0%, #303030 25%, #00DC82 50%, #36E4DA 75%, #0047E1 100%);
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 12px;
    padding: 2px;
    width: 100%;
    background-size: 400% auto;
    opacity: 0;
    transition: background-position 0.3s ease-in-out, opacity 0.2s ease-in-out;
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
            mask:
              linear-gradient(#fff 0 0) content-box,
              linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
            mask-composite: exclude;
  }
  .gradient-border:hover::before {
    background-position: -50% 0;
    opacity: 0.8;
  }
}
</style>
