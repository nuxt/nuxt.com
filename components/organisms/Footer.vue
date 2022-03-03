
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
          <ul class="flex flex-col gap-y-5">
            <li v-for="link in item.items" :key="link.title">
              <ULink :to="link.to">
                {{ link.title }}
              </ULink>
            </li>
          </ul>
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
          <ul class="flex gap-x-6">
            <li v-for="social in socialLinks" :key="social.name">
              <a :href="social.href">
                <UIcon :name="social.name" class="w-6 h-5 u-text-gray-900 hover:u-text-gray-500" />
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div class="flex flex-col gap-3 pt-6 border-t u-border-gray-200 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-x-2">
          <ThemeSelect name="theme" class="order-1 sm:order-none" size="sm" />
          <span class="text-sm u-text-gray-400">© 2022 Nuxt</span>
        </div>

        <ul class="flex text-sm gap-x-6">
          <li v-for="link in legalLinks" :key="link.title">
            <NuxtLink :to="link.to">
              {{ link.title }}
            </NuxtLink>
          </li>
        </ul>

        <!--
        <USelect
          v-model="langSelected.lang"
          base-class="u-text-gray-400"
          :options="lang"
          name="lang"
          size="sm"
        />
        -->
      </div>
    </UContainer>
  </footer>
</template>

<script setup lang="ts">
import useNewsletter from '~/plugins/newsletter'

const { email, newsletterResult, subscribe, pending, notificationToast } = useNewsletter()

const { findOne } = useContentQuery().where({ id: 'content:footer.md' })

const { data: footerData } = await useAsyncData('footer-content', findOne)

const { legalLinks, links, socialLinks } = footerData.value

// const lang = ref([{ text: 'English', value: 'en' }])

// const langSelected = reactive({ lang: lang[0] })

// watch(newsletterResult, (newVal) => {
//   if (newVal !== '') {
//     notificationToast(newVal)
//   }
// })
</script>
