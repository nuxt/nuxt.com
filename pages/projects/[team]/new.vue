<template>
  <div>
    <PageHeader title="Let's build something new.">
      <template #description>
        Get started with one of our templates. Already have a project?<br>
        <NuxtLink to="/dashboard" class="text-primary-500 hover:underline text-base">
          Import from a Git repository instead.
        </NuxtLink>
      </template>
    </PageHeader>

    <Page header>
      <div role="list" class="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-8 sm:gap-x-6 xl:gap-x-8">
        <UCard
          v-for="(template, index) of templates"
          :key="index"
          padded
          body-class="block w-full overflow-hidden group aspect-w-16 aspect-h-9 relative"
          footer-class="px-4 py-3"
          border-color-class="border-transparent"
          class="cursor-pointer relative group"
          ring-class="ring-1 u-ring-gray-200 lg:hover:u-ring-gray-900 lg:hover:ring-2"
        >
          <img :src="template.screenshot?.url" alt="" class="object-cover pointer-events-none">
          <div class="absolute inset-0 flex items-center justify-center invisible group-hover:visible">
            <div class="u-bg-white p-2 rounded-full z-5 shadow">
              <UIcon name="heroicons-outline:arrow-right" class="w-8 h-8 u-text-gray-900" />
            </div>
            <div class="absolute inset-0 u-bg-gray-900 opacity-20" />
          </div>

          <template #footer>
            <p class="text-lg font-semibold truncate">
              {{ template.title }}
            </p>
            <p class="u-text-gray-400">
              {{ template.description }}
            </p>

            <div class="flex items-center gap-3 mt-3">
              <a :href="template.url" target="_blank" rel="noopener" class="flex items-center u-text-gray-600 text-sm font-medium hover:underline gap-1" @click.stop>
                <UIcon name="heroicons-outline:external-link" class="w-4 h-4" />
                Live demo
              </a>
              <a :href="`https://github.com/${template.owner}/${template.name}/tree/${template.branch}`" target="_blank" rel="noopener" class="flex items-center u-text-gray-600 text-sm font-medium hover:underline gap-1" @click.stop>
                <UIcon name="heroicons-outline:external-link" class="w-4 h-4" />
                GitHub repository
              </a>
            </div>
          </template>
        </UCard>
      </div>
    </Page>
  </div>
</template>

<script setup lang="ts">
import type { Template } from '~/types'

const { find } = useStrapi4()

const form = reactive({
  template: null
})

definePageMeta({
  middleware: 'auth'
})

const { data: templates } = await useAsyncData('templates', () => find<Template[]>('templates', { populate: ['screenshot'] }))
</script>
