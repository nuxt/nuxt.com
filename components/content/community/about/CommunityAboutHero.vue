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
        <UInput
          v-model="form.email"
          name="email"
          placeholder="Enter your email"
          class="sm:w-72"
          required
        />
        <UButton
          type="submit"
          submit
          variant="primary"
          :loading="loading"
          label="Subscribe"
        />
      </form>
    </template>

    <template #image>
      <img src="/assets/community/about/gems.svg" class="object-contain h-full mx-10 opacity-30 sm:opacity-100">

      <UCard padded body-class="p-4" class="hidden lg:block absolute left-[72px] top-6 w-[181px] h-[116px] backdrop-blur-lg !bg-opacity-10">
        <UIcon name="uil:star" class="w-5 h-5 text-teal-400" />

        <div>
          <p class="mb-2 text-4xl font-semibold u-text-gray-900">
            {{ formatNumber(stats.stars, 1) }}
          </p>
          <p class="text-xs u-text-gray-500">
            Github stars
          </p>
        </div>
      </UCard>

      <UCard padded body-class="p-4" class="hidden lg:block absolute -bottom-[46px] -left-10 w-[136px] h-[117px] backdrop-blur-lg !bg-opacity-10">
        <UIcon name="uil:folder" class="w-5 h-5 text-green-400" />

        <div>
          <p class="mb-2 text-4xl font-semibold u-text-gray-900">
            {{ formatNumber(stats.count) }}
          </p>
          <p class="text-xs u-text-gray-500">
            Repositories
          </p>
        </div>
      </UCard>

      <UCard padded body-class="p-4" class="hidden lg:block absolute right-4 -bottom-4 w-[137px] h-[115px] backdrop-blur-lg !bg-opacity-10">
        <UIcon name="heroicons-outline:users" class="w-5 h-5 text-indigoblue-600" />

        <div>
          <p class="mb-2 text-4xl font-semibold u-text-gray-900">
            {{ formatNumber(stats.collaborators) }}
          </p>
          <p class="text-xs u-text-gray-500">
            Nuxters
          </p>
        </div>
      </UCard>
    </template>
  </PageHero>
</template>

<script setup lang="ts">
import { formatNumber } from '~/utils'

const { stats } = useCommunityRepositories()

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
