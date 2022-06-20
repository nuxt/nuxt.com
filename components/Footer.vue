
<template>
  <footer class="relative border-t u-bg-white u-border-gray-200">
    <div class="absolute inset-x-0 flex items-center justify-center -top-3">
      <div class="px-2 u-bg-white">
        <Logo class="w-5 h-5 u-text-gray-200" />
      </div>
    </div>

    <UContainer padded class="py-6">
      <div class="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <div class="flex flex-col-reverse items-center gap-3 sm:flex-row">
          <ThemeSelect name="theme" class="order-1 sm:order-none" size="sm" />
          <span class="text-sm u-text-gray-400">© 2022 Nuxt</span>
        </div>

        <ul class="flex flex-wrap justify-center text-sm gap-x-6 gap-y-2">
          <li v-for="link in links" :key="link.title">
            <NuxtLink :to="link._path" class="font-medium u-text-gray-500 hover:u-text-gray-900 focus:u-text-gray-900" active-class="font-medium u-text-gray-900">
              {{ link.title }}
            </NuxtLink>
          </li>
        </ul>

        <USelect
          v-model="lang"
          :options="langs"
          name="lang"
          size="sm"
        />
      </div>
    </UContainer>
  </footer>
</template>

<script setup lang="ts">
const { navFromPath } = useContent()

const links = computed(() => navFromPath('/company')?.children)

const langs = ref([{ text: 'English', value: 'en' }])
const lang = ref(langs.value[0].value)
</script>
