<script setup lang="ts">
import { kebabCase } from 'scule'

const route = useRoute()
definePageMeta({
  heroBackground: 'opacity-70 -z-10'
})
const { data: page } = await useAsyncData(kebabCase(route.path), () => queryCollection('team').first())

const title = page.value.title
const description = page.value.description

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

const icons = {
  website: 'i-lucide-link',
  twitter: 'i-simple-icons-x',
  twitch: 'i-simple-icons-twitch',
  youtube: 'i-simple-icons-youtube',
  instagram: 'i-simple-icons-instagram',
  linkedin: 'i-simple-icons-linkedin',
  mastodon: 'i-simple-icons-mastodon',
  bluesky: 'i-simple-icons-bluesky',
  github: 'i-simple-icons-github'
}

const { data } = await useFetch('/api/teams', { key: 'teams' })
const teams = [
  {
    name: 'Core Team',
    team: data.value.core,
    link: 'https://github.com/orgs/nuxt/teams/core'
  },
  {
    name: 'Ecosystem Team',
    team: data.value.ecosystem,
    link: 'https://github.com/orgs/nuxt/teams/ecosystem'
  }
]
</script>

<template>
  <UContainer>
    <UPageHero
      :title="title"
      :description="description"
    >
      <template #description>
        <MDC :value="page.description" cache-key="team-hero-description" />
      </template>
    </UPageHero>

    <UPage>
      <UPageBody class="mt-0">
        <template v-for="(team, index) of teams" :key="index">
          <h2 class="font-bold text-2xl mb-4 flex gap-2 items-center justify-between" :class="{ 'mt-12 md:mt-24': !!index }">
            <span>{{ team.name }}</span>
            <UButton
              :to="team.link"
              color="neutral"
              variant="soft"
              size="sm"
              :icon="icons.github"
              target="_blank"
              label="View on GitHub"
            />
          </h2>
          <UPageGrid class="xl:grid-cols-4">
            <UPageCard
              v-for="(user, teamIndex) in team.team"
              :key="teamIndex"
              :title="user.name"
              :description="[user.pronouns, user.location].filter(Boolean).join(' ・ ')"
              :ui="{
                container: 'gap-y-3',
                leading: 'flex justify-center',
                title: 'text-center',
                description: 'text-center'
              }"
              variant="subtle"
            >
              <template #leading>
                <UAvatar provider="ipx" :src="`https://ipx.nuxt.com/f_auto,s_80x80/gh_avatar/${user.login}`" :srcset="`https://ipx.nuxt.com/f_auto,s_160x160/gh_avatar/${user.login} 2x`" size="3xl" class="mx-auto" />
              </template>

              <div class="flex items-center justify-center gap-1">
                <UButton
                  v-for="(link, key) in user.socialAccounts"
                  :key="key"
                  color="neutral"
                  variant="link"
                  :to="link.url"
                  :icon="icons[key] || icons.website"
                  :alt="`Link to ${user.name}'s ${key} profile`"
                  target="_blank"
                  size="sm"
                />
                <UButton
                  :to="`https://github.com/${user.login}`"
                  color="neutral"
                  variant="link"
                  :alt="`Link to ${user.name}'s GitHub profile`"
                  :icon="icons.github"
                  target="_blank"
                />
                <UButton
                  v-if="user.websiteUrl"
                  :to="user.websiteUrl"
                  color="neutral"
                  variant="link"
                  :alt="`Link to ${user.name}'s personal website`"
                  :icon="icons.website"
                  target="_blank"
                />
              </div>
              <div v-if="user.sponsorsListing" class="flex items-center justify-center">
                <UButton
                  :to="user.sponsorsListing"
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
        </template>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
