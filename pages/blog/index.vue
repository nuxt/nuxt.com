<script setup lang="ts">
const route = useRoute()
const { fetchList, articles } = useBlog()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())

useContentHead(page)

await fetchList()
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page">
      <template #links>
        <NewsletterForm class="flex-1 max-w-xs" />
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
            class="flex flex-col"
            :ui="{
              divide: '',
              header: { base: 'aspect-w-4 aspect-h-2', padding: '' },
              footer: { padding: 'px-4 pb-4 sm:px-6' },
              title: 'text-lg'
            }"
          >
            <template #header>
              <img
                :src="article.image"
                :alt="article.title || ''"
                :loading="index === 0 ? 'eager' : 'lazy'"
                class="object-cover object-top w-full h-full"
                height="366"
                width="488"
              >
            </template>

            <template #description>
              <span class="line-clamp-2">{{ article.description }}</span>

              <UBadge :label="article.category" variant="subtle" class="mt-4" />
            </template>

            <template #footer>
              <div class="flex items-center justify-between gap-3">
                <time class="text-muted">{{ formatDateByLocale('en', article.date) }}</time>

                <UAvatarGroup size="xs">
                  <UAvatar
                    v-for="(author, subIndex) in article.authors"
                    :key="subIndex"
                    :src="author.avatarUrl"
                    :alt="author.name"
                  />
                </UAvatarGroup>
              </div>
            </template>
          </UPageCard>
        </UPageGrid>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
