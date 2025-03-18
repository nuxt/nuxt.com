<script lang="ts" setup>
import type { VideoCourse } from '../types'

definePageMeta({
  heroBackground: 'opacity-80 -z-10'
})
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
defineOgImageComponent('Docs', {
  title,
  description
})
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page" />
    <UPage>
      <UPageBody>
        <ul class="divide-y divide-gray-200 dark:divide-gray-800">
          <li v-for="(course, index) in courses" :key="course.slug" class="flex items-center py-3 gap-2">
            <NuxtImg
              :src="`/assets/video-courses/${course.slug}.png`"
              :alt="course.name"
              :width="'sponsor' in course && course.sponsor ? 96 : 58"
              :height="'sponsor' in course && course.sponsor ? 64 : 32"
              format="webp"
              :modifiers="{ pos: 'top' }"
              :loading="index > 3 ? 'lazy' : undefined"
              class="rounded border dark:border-gray-800 object-cover mr-2 hidden lg:block"
            />
            <h3
              class="font-medium text-gray-700 dark:text-gray-200 flex-grow lg:flex-grow-0"
              :class="'sponsor' in course && course.sponsor ? 'text-xl' : 'text-base'"
            >
              {{ course.name }}
            </h3>
            <p
              class="dark:text-gray-400 text-gray-500 hidden lg:block flex-grow"
              :class="'sponsor' in course && course.sponsor ? 'text-base' : 'text-sm'"
            >
              {{ course.description }}
            </p>
            <UBadge
              v-if="course.badge"
              :label="course.badge"
              variant="subtle"
              size="xs"
              class="rounded-full"
            />
            <UBadge
              v-else
              label="Free"
              color="blue"
              variant="subtle"
              size="xs"
              class="rounded-full"
            />
            <UButton
              v-if="'sponsor' in course && course.sponsor"
              :to="course.url"
              target="_blank"
              trailing-icon="i-ph-arrow-right"
              size="2xs"
              color="green"
            >
              Discover course
            </UButton>
            <UButton
              v-else
              :to="course.url"
              target="_blank"
              trailing-icon="i-ph-arrow-right"
              variant="link"
              :padded="false"
              size="2xs"
              color="gray"
            >
              Discover course
            </UButton>
          </li>
        </ul>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
