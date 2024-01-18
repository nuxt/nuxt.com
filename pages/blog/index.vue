<script setup lang="ts">
const route = useRoute()
const { fetchList, articles } = useBlog()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())

const title = page.value.head?.title || page.value.title
const description = page.value.head?.description || page.value.description
useHead({
  link: [
    {
      rel: 'alternate',
      type: 'application/atom+xml',
      title: 'Nuxt Blog RSS',
      href: 'https://nuxt.com/blog/rss.xml'
    }
  ]
})
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
    <UPageHero v-bind="page">
      <template #links>
        <NewsletterForm class="flex-1 max-w-xs" :description="null" />
      </template>
      <template #description>
        {{ page.description }}
        <UButton
          to="/blog/rss.xml"
          color="gray"
          external
          icon="i-ph-rss"
          size="2xs"
          target="_blank"
        >
          RSS
        </UButton>
      </template>
    </UPageHero>

    <UPage>
      <UPageBody>
        <UPageGrid>
          <UPageCard
            v-for="(article, index) in articles"
            :key="index"
            :to="article._path"
            :title="article.title"
            :description="article.description"
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
                :src="article.image"
                :alt="article.title || ''"
                :loading="index === 0 ? 'eager' : 'lazy'"
                class="object-cover object-top w-full h-full"
                width="384"
                height="192"
              />
            </template>

            <template #icon>
              <UBadge :label="article.category" variant="subtle" />
            </template>

            <template #footer>
              <div class="flex items-center justify-between gap-3">
                <time class="text-gray-500 dark:text-gray-400">{{ formatDateByLocale('en', article.date) }}</time>

                <UAvatarGroup size="xs">
                  <UAvatar
                    v-for="(author, subIndex) in article.authors"
                    :key="subIndex"
                    :src="author.avatarUrl"
                    :alt="author.name"
                    loading="lazy"
                    class="lg:hover:scale-110 lg:hover:ring-primary-500 dark:lg:hover:ring-primary-400 transition-transform"
                  >
                    <NuxtLink v-if="author.link" :to="author.link" target="_blank" class="focus:outline-none" tabindex="-1">
                      <span class="absolute inset-0" aria-hidden="true" />
                    </NuxtLink>
                  </UAvatar>
                </UAvatarGroup>
              </div>
            </template>
          </UPageCard>
        </UPageGrid>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
