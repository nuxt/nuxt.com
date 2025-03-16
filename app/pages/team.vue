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

const { data: coreTeam } = await useFetch<TeamMember[]>('https://api.nuxt.com/teams/core')
const { data: ecosystemTeam } = await useFetch<TeamMember[]>('https://api.nuxt.com/teams/ecosystem', {
  transform(team) {
    return team.filter(t => !coreTeam.value?.some(c => c.login === t.login)).map((t) => {
      return {
        ...t,
        websiteUrl: !t.websiteUrl || t.websiteUrl.startsWith('http://') || t.websiteUrl.startsWith('https://') ? t.websiteUrl : `https://${t.websiteUrl}`
      }
    })
  }
})
const teams = [
  {
    name: 'Core team',
    team: coreTeam.value,
    link: 'https://github.com/orgs/nuxt/teams/core'
  },
  {
    name: 'Ecosystem team',
    team: ecosystemTeam.value,
    link: 'https://github.com/orgs/nuxt/teams/ecosystem'
  }
]
</script>

<template>
  <UContainer>
    <UPageHero
      :title="title"
      :description="description"
      :links="page.links"
    >
      <template #description>
        <MDC :value="page.description" />
      </template>
    </UPageHero>

    <UPage>
      <UPageBody>
        <template v-for="(team, index) of teams" :key="index">
          <h2 class="font-bold text-xl px-2 mb-4 flex gap-2 items-center" :class="{ 'mt-12 md:mt-24': !!index }">
            {{ team.name }}
          </h2>
          <UPageGrid class="xl:grid-cols-4">
            <UPageCard
              v-for="(user, teamIndex) in team.team"
              :key="teamIndex"
              :title="user.name"
              :description="[user.pronouns, user.location].filter(Boolean).join(' ・ ')"
              :ui="{
                container: 'gap-y-4',
                leading: 'flex justify-center',
                title: 'text-center',
                description: 'text-center'
              }"
            >
              <template #leading>
                <UAvatar :src="`https://ipx.nuxt.com/f_auto,s_80x80/gh_avatar/${user.login}`" :srcset="`https://ipx.nuxt.com/f_auto,s_160x160/gh_avatar/${user.login} 2x`" size="3xl" class="mx-auto" />
              </template>

              <div class="flex items-center justify-center gap-1.5 mt-4">
                <UButton
                  v-for="(link, key) in user.socialAccounts"
                  :key="key"
                  color="neutral"
                  variant="link"
                  :to="link.url"
                  :icon="icons[key] || icons.website"
                  :alt="`Link to ${user.name}'s ${key} profile`"
                  target="_blank"
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
              <div v-if="user.sponsorsListing" class="flex items-center justify-center mt-4">
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
