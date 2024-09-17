<script setup lang="ts">
const route = useRoute()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())

const title = page.value.head?.title || page.value.title
const description = (page.value.head?.description || page.value.description).replace(/<br>/g, '')
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
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span v-html="page.description" />
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
              title: 'justify-center',
              description: 'text-center'
            }"
          >
            <template #icon>
              <UAvatar v-bind="user.avatar" size="3xl" class="mx-auto" />
            </template>

            <div class="flex items-center justify-center gap-1.5 mt-4">
              <UButton v-for="(link, i) in user.links" :key="i" color="gray" variant="link" v-bind="link" />
            </div>
            <div v-if="user.sponsor" class="flex items-center justify-center mt-4">
              <UButton
                :to="user.sponsor"
                target="_blank"
                color="gray"
                icon="i-ph-heart"
                icon-color="red"
                :ui="{ icon: { base: 'text-pink-500' } }"
              >
                Sponsor
              </UButton>
            </div>
          </UPageCard>
        </UPageGrid>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
