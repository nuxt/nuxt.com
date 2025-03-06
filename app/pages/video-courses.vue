<script lang="ts" setup>
definePageMeta({
  heroBackground: 'opacity-80 -z-10'
})
const { data: page } = await useAsyncData('video-courses-landing', () => queryCollection('landing').path('/video-courses').first())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const { data: courses } = await useAsyncData('video-courses', () => queryCollection('videoCourses').all())

const title = page.value.title
const description = page.value.description

useSeoMeta({
  titleTemplate: '%s',
  title,
  description,
  ogDescription: description,
  ogTitle: title
})
defineOgImageComponent('Docs')
</script>

<template>
  <UContainer>
    <UPageHero
      v-bind="page"
    />
    <UPage>
      <UPageBody>
        <ul class="divide-y divide-(--ui-border)">
          <li v-for="(course, index) in courses" :key="course.slug" class="flex items-center py-3 gap-2">
            <NuxtImg
              :src="`/assets/video-courses/${course.slug}.png`"
              :alt="course.name"
              :width="'sponsor' in course && course.sponsor ? 96 : 58"
              :height="'sponsor' in course && course.sponsor ? 64 : 32"
              format="webp"
              :modifiers="{ pos: 'top' }"
              :loading="index > 3 ? 'lazy' : undefined"
              class="rounded border border-(--ui-border) object-cover mr-2 hidden lg:block"
            />
            <h3
              class="font-medium text-(--ui-text-highlighted) text-nowrap flex-grow lg:flex-grow-0"
              :class="'sponsor' in course && course.sponsor ? 'text-xl' : 'text-base'"
            >
              {{ course.name }}
            </h3>
            <p
              class="text-(--ui-text-muted) hidden lg:block flex-grow truncate"
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
              color="info"
              variant="subtle"
              size="sm"
              class="rounded-full"
            />
            <UButton
              v-if="'sponsor' in course && course.sponsor"
              :to="course.url"
              target="_blank"
              trailing-icon="i-lucide-arrow-right"
              size="sm"
              color="success"
              label="Discover course"
            />
            <UButton
              v-else
              :to="course.url"
              target="_blank"
              trailing-icon="i-lucide-arrow-right"
              variant="link"
              size="sm"
              color="neutral"
              label="Discover course"
            />
          </li>
        </ul>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
