<script lang="ts" setup>
definePageMeta({
  heroBackground: 'opacity-80 -z-10'
})
const { data: page } = await useAsyncData('templates-landing', () => queryCollection('landing').path('/templates').first())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const title = page.value.title
const description = page.value.description

const { data: templates } = await useAsyncData('templates', () => queryCollection('templates').all())

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
      :ui="{
        container: 'py-10 sm:py-20 lg:py-20 px-0 sm:px-0 lg:px-0',
        title: 'sm:text-5xl'
      }"
    />
    <UPage>
      <UPageBody>
        <UPageGrid class="lg:grid-cols-3 xl:grid-cols-4">
          <UPageCard
            v-for="(template, index) in templates"
            :key="template.slug"
            :description="template.description"
            :ui="{
              container: 'p-0 sm:p-0',
              body: 'p-4 h-[105px]',
              header: 'relative mb-0 aspect-video',
              title: 'flex items-center w-full',
              description: 'line-clamp-2',
              footer: 'mt-0 px-4 pb-4'
            }"
            class="overflow-hidden"
          >
            <template #header>
              <NuxtImg
                :src="`/assets/templates/${template.slug}.png`"
                class="object-cover object-top w-full h-full xl:hidden"
                :alt="template.name"
                width="600"
                height="300"
                format="webp"
                :modifiers="{ pos: 'top' }"
                :loading="index > 3 ? 'lazy' : undefined"
              />
              <NuxtImg
                :src="`/assets/templates/${template.slug}.png`"
                class="object-cover object-top size-full hidden xl:block"
                :alt="template.name"
                width="280"
                height="140"
                format="webp"
                :modifiers="{ pos: 'top' }"
                :loading="index > 3 ? 'lazy' : undefined"
              />
            </template>
            <template #title>
              <div class="w-full grid grid-cols-[1fr_auto] items-center gap-2">
                <p class="truncate m-0">
                  {{ template.name }}
                </p>
                <div class="flex shrink-0 gap-1">
                  <UBadge
                    v-if="template.badge === 'Premium'"
                    :label="template.badge"
                    color="info"
                    variant="subtle"
                    size="xs"
                    class="rounded-full"
                  />
                  <UBadge
                    v-else-if="template.badge === 'Freemium'"
                    :label="template.badge"
                    color="success"
                    variant="subtle"
                    size="xs"
                    class="rounded-full"
                  />
                </div>
              </div>
            </template>
            <template #footer>
              <UButtonGroup class="w-full">
                <UButton
                  label="Demo"
                  icon="i-ph-desktop"
                  :to="template.demo"
                  target="_blank"
                  size="sm"
                  color="neutral"
                  variant="subtle"
                  class="w-1/2 justify-center"
                />
                <UButton
                  v-if="template.repo"
                  label="GitHub"
                  icon="i-simple-icons-github"
                  :to="`https://github.com/${template.repo}`"
                  target="_blank"
                  size="sm"
                  color="neutral"
                  variant="subtle"
                  class="w-1/2 justify-center"
                />
                <UButton
                  v-else-if="template.purchase"
                  target="_blank"
                  :to="template.purchase"
                  color="neutral"
                  label="Purchase"
                  variant="subtle"
                  icon="i-ph-credit-card"
                  size="sm"
                  class="w-1/2 justify-center"
                />
              </UButtonGroup>
            </template>
          </UPageCard>
        </UPageGrid>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
