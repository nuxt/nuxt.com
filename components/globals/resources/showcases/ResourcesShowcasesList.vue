<template>
  <UContainer padded class="py-2">
    <div class="flex gap-4">
      <div class="flex-shrink-0 w-80 hidden md:block">
        TODO: Categories
      </div>

      <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <div v-for="showcase in selectedShowcases" :key="showcase.id">
          <NuxtLink :to="showcase.url" target="_blank" class="block group rounded-xl overflow-hidden border u-border-gray-50">
            <div class="aspect-w-4 aspect-h-3">
              <img
                :src="`https://res.cloudinary.com/nuxt/image/upload/f_auto,q_auto/${showcase.screenshotUrl}`"
                :alt="showcase.hostname"
                width="800"
                height="600"
                loading="lazy"
                class="object-cover absolute inset-0"
              >
              <div class="absolute inset-0">
                <div class="absolute bottom-0 inset-x-0 h-[50%] hidden group-hover:block" :style="{ background: 'linear-gradient(#00000000, #00000055)' }" />
                <div class="absolute bottom-0 inset-x-0 u-bg-gray-50 group-hover:bg-transparent">
                  <div class="flex justify-between items-center gap-1 py-2 px-4">
                    <h2 class="font-bold truncate group-hover:u-text-white">
                      {{ showcase.title }}
                    </h2>
                    <UIcon name="heroicons-outline:external-link" class="w-5 h-5 u-text-white hidden group-hover:inline flex-shrink-0" />
                  </div>
                  <p class="text-sm pb-2 px-4 truncate group-hover:hidden">
                    {{ showcase.hostname }}
                  </p>
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import { $fetch } from 'ohmyfetch'
import uniqBy from 'lodash/uniqBy'

const props = defineProps({
  id: {
    type: [Number, String],
    required: true
  }
})

const { data: showcases } = await useAsyncData('showcases', async () => {
  const showcases = await $fetch(`https://api.vuetelescope.com/lists/${props.id}`)

  // ensure groups & showcases are well sorted
  showcases.groups?.sort((a, b) => Number(a.position) - Number(b.position))
  showcases.groups?.forEach((group) => {
    group.showcases.sort((a, b) => Number(a.position) - Number(b.position))
  })

  return showcases
})

const route = useRoute()

const selectedCategory = ref((route.hash || '').substring(1))

const selectedShowcases = computed(() => uniqBy(
  showcases.value?.groups
    ?.filter((group, index) => (!selectedCategory.value && index === 0) || group.name === selectedCategory.value)
    ?.map(group => ({
      ...group,
      showcases: group.showcases.map(showcase => ({
        ...showcase
      }))
    }))
    ?.flatMap(group => group.showcases) || [],
  'id'
))
</script>
