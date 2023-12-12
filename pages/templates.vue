<script lang="ts" setup>
import type { Template } from '../types'

const { data: page } = await useAsyncData('templates', () => queryContent('/templates').findOne())

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
            :description="template.description"
            :ui="{
              header: { base: 'aspect-w-4 aspect-h-2', padding: '' },
              body: { padding: '!p-4' },
              description: 'line-clamp-2 sm:min-h-[45px]'
            }"
          >
            <template #header>
              <NuxtImg
                :src="`/assets/templates/${template.slug}.png`"
                class="object-cover object-top w-full h-full"
                :alt="template.name"
                width="280"
                height="140"
                format="webp"
                :modifiers="{ pos: 'top' }"
                :loading="index > 3 ? 'lazy' : undefined"
              />
            </template>
            <template #title>
              <span class="flex-1">{{ template.name }}</span>
              <UBadge
                v-if="template.badge"
                :label="template.badge"
                variant="subtle"
                size="xs"
                class="rounded-full"
              />
            </template>

            <UButtonGroup class="mt-3 w-full">
              <UButton
                label="Demo"
                icon="i-ph-desktop-duotone"
                :to="template.demo"
                target="_blank"
                size="sm"
                color="gray"
                class="w-1/2 justify-center"
                :ui="{ icon: { size: { sm: 'w-4 h-4' } } }"
              />
              <UButton
                v-if="template.repo"
                label="GitHub"
                icon="i-simple-icons-github"
                :to="`https://github.com/${template.repo}`"
                target="_blank"
                size="sm"
                color="gray"
                class="w-1/2 justify-center"
                :ui="{ icon: { size: { sm: 'w-4 h-4' } } }"
              />
              <UButton
                v-else-if="template.purchase"
                target="_blank"
                :to="template.purchase"
                color="gray"
                label="Purchase"
                icon="i-ph-credit-card-duotone"
                size="sm"
                class="w-1/2 justify-center"
                :ui="{ icon: { size: { sm: 'w-4 h-4' } } }"
              />
            </UButtonGroup>
          </UPageCard>
        </UPageGrid>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
