<script lang="ts" setup>
definePageMeta({
  heroBackground: 'opacity-80 -z-10'
})
const [{ data: page }, { data: courses }] = await Promise.all([
  useAsyncData('video-courses', () => clientContent.get('/video-courses')),
  useAsyncData('video-courses-list', () => listChildren('/video-courses'))
])

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const title = page.value.data.title
const description = page.value.data.description

useSeoMeta({
  titleTemplate: '%s',
  title,
  description,
  ogDescription: description,
  ogTitle: title
})
useCanonical()
defineOgImage('Docs.takumi', {
  headline: 'Resources',
  title,
  description
})
</script>

<template>
  <UContainer v-if="page.data">
    <UPageHero
      :title="page.data.title"
      :description="page.data.description"
    />
    <UPage>
      <UPageBody>
        <ul class="divide-y divide-default">
          <li v-for="(course, index) in courses" :key="course.data.slug" class="flex items-center py-3 gap-2">
            <NuxtImg
              :src="`/assets/video-courses/${course.data.slug}.webp`"
              :alt="course.data.name"
              :width="course.data.sponsor ? 94 : 56"
              :height="course.data.sponsor ? 47 : 28"
              format="webp"
              :modifiers="{ position: 'top' }"
              :loading="index > 3 ? 'lazy' : undefined"
              class="rounded border border-default object-cover mr-2 hidden lg:block"
            />
            <h3
              class="font-medium text-highlighted text-nowrap flex-grow lg:flex-grow-0"
              :class="course.data.sponsor ? 'text-xl' : 'text-base'"
            >
              {{ course.data.name }}
            </h3>
            <p
              class="text-muted hidden lg:block flex-grow truncate"
              :class="course.data.sponsor ? 'text-base' : 'text-sm'"
            >
              {{ course.data.description }}
            </p>
            <UBadge
              v-if="course.data.badge"
              :label="course.data.badge"
              variant="subtle"
              class="rounded-full"
            />
            <UBadge
              v-else
              label="Free"
              color="info"
              variant="subtle"
              class="rounded-full"
            />
            <UButton
              v-if="course.data.sponsor"
              :to="course.data.url"
              target="_blank"
              trailing-icon="i-lucide-arrow-right"
              size="sm"
              color="success"
              label="Discover course"
            />
            <UButton
              v-else
              :to="course.data.url"
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
