<script setup lang="ts">
const route = useRoute()
definePageMeta({
  heroBackground: 'opacity-70 -z-10'
})
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

interface TeamMember {
  name: string
  login: string
  avatarUrl: string
  pronouns?: string
  location?: string
  websiteUrl?: string
  sponsorsListing?: string
  socialAccounts: Record<string, { displayName: string, url: string }>
}

const icons = {
  website: 'i-ph-link',
  twitter: 'i-simple-icons-x',
  twitch: 'i-simple-icons-twitch',
  youtube: 'i-simple-icons-youtube',
  instagram: 'i-simple-icons-instagram',
  linkedin: 'i-simple-icons-linkedin',
  mastodon: 'i-simple-icons-mastodon',
  bluesky: 'i-simple-icons-bluesky',
  github: 'i-simple-icons-github'
}

const { data: team } = await useFetch<TeamMember[]>('https://api.nuxt.com/teams/core')
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
            v-for="(user, index) in team"
            :key="index"
            :title="user.name"
            :description="user.location"
            :ui="{
              title: 'justify-center',
              description: 'text-center'
            }"
          >
            <template #icon>
              <UAvatar :src="`https://ipx.nuxt.com/f_auto,s_80x80/gh_avatar/${user.login}`" :srcset="`https://ipx.nuxt.com/f_auto,s_160x160/gh_avatar/${user.login} 2x`" size="3xl" class="mx-auto" />
            </template>

            <div class="flex items-center justify-center gap-1.5 mt-4">
              <UButton
                v-for="(link, key) in user.socialAccounts"
                :key="key"
                color="gray"
                variant="link"
                :to="link.url"
                :icon="icons[key] || icons.website"
                :alt="`Link to ${user.name}'s ${key} profile`"
                target="_blank"
              />
              <UButton
                :to="`https://github.com/${user.login}`"
                color="gray"
                variant="link"
                :alt="`Link to ${user.name}'s GitHub profile`"
                :icon="icons.github"
                target="_blank"
              />
              <UButton
                v-if="user.websiteUrl"
                :to="user.websiteUrl"
                color="gray"
                variant="link"
                :alt="`Link to ${user.name}'s personal website`"
                :icon="icons.website"
                target="_blank"
              />
            </div>
            <div v-if="user.sponsorsListing" class="flex items-center justify-center mt-4">
              <UButton
                :to="user.sponsorsListing"
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
