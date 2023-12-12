<script lang="ts" setup>
import type { Template } from '../types'

const route = useRoute()

const { data: page } = await useAsyncData('templates', () => queryContent(route.path).findOne())

const title = page.value.head?.title || page.value.title
const description = page.value.head?.description || page.value.description

const templates: ComputedRef<Template[]> = computed(() => page.value.templates)

useSeoMeta({
  titleTemplate: '%s',
  title,
  description,
  ogDescription: description,
  ogTitle: title
})

defineOgImage({
  component: 'Docs',
  title,
  description,
  headline: ''
})
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page" />

    <UPage>
      <UPageBody>
        <UPageGrid class="lg:grid-cols-3 xl:grid-cols-4">
          <UPageCard
            v-for="(template, index) in templates"
            :key="index"
            :title="template.name"
            :description="template.description"
            :ui="{
              header: { base: 'aspect-w-4 aspect-h-2', padding: '' },
              body: { padding: '!p-4' },
              description: 'line-clamp-2 sm:min-h-[45px]'
            }"
          >
            <template #header>
              <NuxtImg
                :src="template.image"
                class="object-cover object-top w-full h-full"
                :alt="template.name"
                width="280"
                height="140"
                format="webp"
                :loading="index > 3 ? 'lazy' : undefined"
              />
            </template>

            <UButtonGroup class="mt-3 w-full">
              <UButton
                v-if="template.repo"
                label="GitHub"
                icon="i-simple-icons-github"
                :to="`https://github.com/${template.repo}/tree/${template.branch}`"
                target="_blank"
                size="sm"
                color="gray"
                class="w-1/2 justify-center"
                :ui="{ icon: { size: { sm: 'w-4 h-4' } } }"
              />

              <UButton
                target="_blank"
                :to="template.shop || template.demo"
                color="gray"
                :label="template.shop ? 'Purchase' : 'Demo'"
                icon="i-ph-arrow-up-right-bold"
                trailing
                size="sm"
                class="justify-center"
                :class="[template.repo ? 'w-1/2' : 'w-full']"
                :ui="{ icon: { size: { sm: 'w-4 h-4' } } }"
              />
            </UButtonGroup>
          </UPageCard>
        </UPageGrid>

        <ULandingSection :title="page.further.title" :description="page.further.description">
          <UButtonGroup
            :ui="{
              strategy: 'override',
              wrapper: {
                horizontal: 'inline-flex flex-col lg:flex-row -space-y-px lg:space-y-0 lg:-space-x-px'
              },
              orientation: {
                'rounded-md': {
                  horizontal: {
                    start: 'rounded-t-md lg:rounded-tr-none lg:rounded-s-md',
                    end: 'rounded-b-md lg:rounded-bl-none lg:rounded-e-md'
                  }
                }
              }
            }"
          >
            <UButton
              v-for="(item, index) in page.further.items"
              :key="index"
              :to="item.to"
              class="py-5 px-4 sm:p-6 flex-1 group transition-colors"
              color="white"
              :ui="{
                strategy: 'override',
                color: {
                  white: {
                    solid: 'ring-1 ring-inset ring-gray-200 dark:ring-gray-800 bg-white dark:bg-gray-900/50 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                  }
                }
              }"
            >
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <h3 class="text-gray-900 dark:text-white font-bold text-lg">
                    {{ item.title }}
                  </h3>

                  <UIcon name="i-ph-arrow-right-light" class="w-5 h-5 mr-2 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400 group-hover:translate-x-2 transition-translate duration-200" />
                </div>

                <p class="text-gray-400 dark:text-gray-500 text-base font-normal mt-2">
                  {{ item.description }}
                </p>
              </div>
            </UButton>
          </UButtonGroup>
        </ULandingSection>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
