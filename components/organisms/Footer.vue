
<template>
  <footer class="bg-white dark:bg-black">
    <UContainer padded class="my-8">
      <div
        class="grid grid-cols-2 pb-12 sm:grid-cols-4 lg:grid-cols-6 gap-y-12"
      >
        <div
          v-for="item in links"
          :key="item.title"
          class="flex flex-col gap-5 text-sm u-text-gray-600"
        >
          <span class="font-semibold uppercase">{{
            item.title
          }}</span>
          <div v-for="link in item.items" :key="link.title">
            <ULink :to="link.to">
              {{ link.title }}
            </ULink>
          </div>
        </div>
        <div
          class="flex flex-col items-start col-span-2 gap-5 sm:col-span-4 lg:col-span-2"
        >
          <LogoFull class="w-auto h-12 u-text-gray-900" />
          <span class="text-sm u-text-gray-700">Stay up to date with our newsletter</span>
          <form class="flex w-full gap-3" @submit.prevent="subscribe">
            <UInput
              v-model="email"
              name="email"
              placeholder="Enter your email"
              class="w-60 lg:flex-1"
              size="sm"
            />
            <UButton
              type="submit"
              submit
              variant="primary"
              :loading="pending"
              size="xs"
            >
              Subscribe
            </UButton>
          </form>
        </div>
      </div>
      <div class="flex flex-col gap-3 pt-6 border-t u-border-gray-200 sm:flex-row sm:items-center sm:justify-between">
        <ThemeSelect name="theme" class="order-1 sm:order-none" size="sm" />

        <ul class="flex text-sm gap-x-6">
          <li v-for="link in legalLinks" :key="link.title">
            <NuxtLink :to="link.to">
              {{ link.title }}
            </NuxtLink>
          </li>
        </ul>

        <USelect
          v-model="langSelected.lang"
          :options="lang"
          name="lang"
          siez="sm"
        />
      </div>
    </UContainer>
  </footer>
</template>

<script setup lang="ts">
import useNewsletter from '~/plugins/newsletter'

const { $toast } = useNuxtApp()
const { email, newsletterResult, subscribe, pending, notificationToast } = useNewsletter()

const lang = ref([{ text: 'English', value: 'en' }])
const langSelected = reactive({ lang: lang[0] })
const links = ref([
  {
    title: 'solutions',
    items: [
      { title: 'Developers', to: '#' },
      { title: 'Independants', to: '#' },
      { title: 'Agencies', to: '#' },
      { title: 'Enterprises', to: '#' },
      { title: 'Certifications', to: '#' }
    ]
  },
  {
    title: 'Resources',
    items: [
      { title: 'Articles', to: '#' },
      { title: 'Case Studies', to: '#' },
      { title: 'Design Kit', to: '#' },
      { title: 'Live Events', to: '#' },
      { title: 'Video Courses', to: '#' }
    ]
  },
  {
    title: 'Company',
    items: [
      { title: 'About', to: '#' },
      { title: 'Contact', to: '#' },
      { title: 'Careers', to: '#' },
      { title: 'Customers', to: '#' },
      { title: 'Partners', to: '#' }
    ]
  },
  {
    title: 'Support',
    items: [
      { title: 'Help Center', to: '#' },
      { title: 'Book a Session', to: '#' },
      { title: 'Find an Expert', to: '#' }
    ]
  }
])

const legalLinks = ref([
  { title: 'License', to: '#' },
  { title: 'Terms', to: '#' },
  { title: 'Privacy', to: '#' }
])

watch(newsletterResult, (newVal) => {
  if (newVal !== '') {
    notificationToast(newVal)
  }
})

</script>
