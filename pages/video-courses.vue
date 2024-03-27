<script lang="ts" setup>
import type { VideoCourse } from '../types'

const { data: page } = await useAsyncData('video-courses', () => queryContent('/video-courses').findOne())

const title = page.value.head?.title || page.value.title
const description = page.value.head?.description || page.value.description

const courses: ComputedRef<VideoCourse[]> = computed(() => page.value.courses)

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
        <UPageGrid class="lg:grid-cols-3">
          <UPageCard
            v-for="(course, index) in courses"
            :key="course.slug"
            :description="course.description"
            :to="course.url"
            target="_blank"
            :ui="{
              header: { base: 'aspect-w-4 aspect-h-2', padding: '' },
              body: { padding: '!p-4' },
              description: 'line-clamp-2 sm:min-h-[45px]'
            }"
            class="overflow-hidden"
          >
            <template #header>
              <NuxtImg
                :src="`/assets/video-courses/${course.slug}.png`"
                class="object-cover object-top w-full h-full xl:hidden"
                :alt="course.name"
                width="600"
                height="300"
                format="webp"
                :modifiers="{ pos: 'top' }"
                :loading="index > 3 ? 'lazy' : undefined"
              />
              <NuxtImg
                :src="`/assets/video-courses/${course.slug}.png`"
                class="object-cover object-top w-full h-full hidden xl:block"
                :alt="course.name"
                width="384"
                height="192"
                format="webp"
                :modifiers="{ pos: 'top' }"
                :loading="index > 3 ? 'lazy' : undefined"
              />
            </template>
            <template #title>
              <span class="flex-1">{{ course.name }}</span>
              <UBadge
                v-if="course.badge"
                :label="course.badge"
                variant="subtle"
                size="xs"
                class="rounded-full"
              />
            </template>
          </UPageCard>
        </UPageGrid>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
