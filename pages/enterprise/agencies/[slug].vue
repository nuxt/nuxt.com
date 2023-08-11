<script setup lang="ts">
import type { Agency } from '~/types'

const route = useRoute()

const { data: agency } = await useAsyncData(route.path, () => queryContent<Agency>(route.path).findOne())
if (!agency.value) {
  throw createError({ statusCode: 404, statusMessage: 'Agency not found' })
}

const links = computed(() => [{
  label: 'Visit website',
  color: 'black',
  size: 'md',
  icon: 'i-ph-arrow-square-out',
  trailing: true,
  to: agency.value.link,
  target: '_blank'
}])
</script>

<template>
  <UContainer>
    <UPageHeader :title="agency.title" :description="agency.description" :links="links" class="sm:py-16">
      <template #icon>
        <UColorModeAvatar :light="agency.logo.light" :dark="agency.logo.dark" size="3xl" class="mt-[2px]" />
      </template>

      <div class="flex flex-col lg:flex-row lg:items-center gap-3 mt-4">
        <div class="flex items-center gap-1.5">
          <UIcon name="i-ph-map-pin" class="w-5 h-5 flex-shrink-0" />
          <span class="text-sm font-medium">{{ agency.location }}</span>
        </div>

        <span v-if="agency.twitter" class="hidden lg:block text-gray-500 dark:text-gray-400">&bull;</span>

        <NuxtLink v-if="agency.twitter" :to="agency.twitter" target="_blank" class="flex items-center gap-1.5 hover:text-primary">
          <UIcon name="i-simple-icons-twitter" class="w-5 h-5" />
          <span class="text-sm font-medium">Twitter</span>
        </NuxtLink>

        <span v-if="agency.github" class="hidden lg:block text-gray-500 dark:text-gray-400">&bull;</span>

        <NuxtLink v-if="agency.github" :to="`https://github.com/${agency.github}`" target="_blank" class="flex items-center gap-1.5 hover:text-primary">
          <UIcon name="i-simple-icons-github" class="w-5 h-5" />
          <span class="text-sm font-medium">GitHub</span>
        </NuxtLink>
      </div>
    </UPageHeader>

    <UPage :ui="{ right: 'my-8' }">
      <UPageBody prose class="prose-lg">
        <h2>Discover the company</h2>

        <p class="whitespace-pre-wrap">
          {{ agency.fullDescription }}
        </p>
      </UPageBody>

      <template #right>
        <div v-if="agency.services?.length">
          <p class="text-sm/6 font-semibold flex items-center gap-1.5 mb-3">
            Services
          </p>

          <div class="prose dark:prose-invert -ml-1.5">
            <ul class="space-y-3">
              <li v-for="(service, index) in agency.services" :key="index" class="text-sm text-gray-500 dark:text-gray-400">
                {{ service }}
              </li>
            </ul>
          </div>
        </div>

        <div v-if="agency.resources?.length">
          <hr class="border-dashed border-gray-200 dark:border-gray-800 my-6">

          <p class="text-sm/6 font-semibold flex items-center gap-1.5 mb-3">
            Resources
          </p>

          <div class="space-y-3">
            <NuxtLink v-for="(resource, index) in agency.resources" :key="index" :to="resource.url" target="_blank" class="block text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              {{ resource.name }}
              <UIcon name="i-ph-arrow-square-out" class="w-4 h-4 flex-shrink-0 align-sub" />
            </NuxtLink>
          </div>
        </div>
      </template>
    </UPage>
  </UContainer>
</template>
