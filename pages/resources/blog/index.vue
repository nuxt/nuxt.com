<template>
  <div>
    <UContainer padded>
      <div class="text-left py-12 md:py-20">
        <h1 class="text-4xl tracking-tight font-extrabold u-text-gray-900 sm:text-5xl">
          Blog
        </h1>
      </div>

      <ul role="list" class="flex flex-col gap-y-4 pb-16">
        <li v-for="(page, index) in pages" :key="page.slug" :class="{ 'border-b last:border-none': index !== 0 }">
          <!-- TODO: order by date, main article is the most recent -->
          <ResourcesBlogPost :page="page" :highlight="index === 0" />
        </li>
      </ul>
    </UContainer>
  </div>
</template>

<script setup>
const { fetchDir } = useContent()

const { data: pages } = await useAsyncData('resources-blog', () => fetchDir('/resources/blog'))
</script>
