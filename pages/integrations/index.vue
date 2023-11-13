<script setup lang="ts">
const route = useRoute()
const { fetchList, integrations } = useIntegrations()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())

const title = page.value.head?.title || page.value.title
const description = page.value.head?.description || page.value.description
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

await fetchList()
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page" />

    <UPage>
      <UPageBody>
        <UPageGrid>
          <UPageCard
            v-for="(integration, index) in integrations"
            :key="index"
            :to="integration._path"
            :title="integration.title"
            :description="integration.description"
            class="flex flex-col"
            :ui="{
              divide: '',
              header: { base: 'aspect-w-4 aspect-h-2', padding: '' },
              footer: { padding: 'pt-0' },
              title: 'text-lg',
              description: 'line-clamp-2'
            }"
          >
            <template #header>
              <NuxtImg
                :src="integration.image"
                :alt="integration.title || ''"
                :loading="index === 0 ? 'eager' : 'lazy'"
                class="object-cover object-top w-full h-full"
                width="384"
                height="192"
              />
            </template>

            <template #icon>
              <div class="flex items-center justify-between w-full">
                <UBadge :label="integration.category" variant="subtle" />
                <UIcon :name="integration.logo" class="w-8 h-8" />
              </div>
            </template>
          </UPageCard>
        </UPageGrid>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
