<script setup lang="ts">
const route = useRoute()
definePageMeta({
  heroBackground: 'opacity-70 -z-10'
})
const { data: page } = await useAsyncData(route.path, () => queryCollection('team').first())

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
    <UPageHero v-bind="page">
      <template #description>
        <MDC :value="page.description" />
      </template>
    </UPageHero>

    <UPage>
      <UPageBody>
        <UPageGrid class="xl:grid-cols-4">
          <UPageCard
            v-for="(user, index) in page.users"
            :key="index"
            :title="user.name"
            :description="user.location"
            :ui="{
              container: 'gap-y-4',
              leading: 'flex justify-center',
              title: 'text-center',
              description: 'text-center'
            }"
          >
            <template #leading>
              <UAvatar v-bind="user.avatar" size="3xl" />
            </template>

            <div class="flex items-center justify-center gap-1.5">
              <UButton v-for="(link, i) in user.links" :key="i" color="neutral" variant="link" v-bind="link" />
            </div>
            <div v-if="user.sponsor" class="flex items-center justify-center">
              <UButton
                :to="user.sponsor"
                target="_blank"
                color="neutral"
                variant="subtle"
                icon="i-lucide-heart"
                label="Sponsor"
                :ui="{ leadingIcon: 'text-pink-500' }"
              />
            </div>
          </UPageCard>
        </UPageGrid>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
