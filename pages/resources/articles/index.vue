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
          <!-- order by date, main article is the most recent -->
          <ResourcesArticlesItem :page="page" :highlight="index === 0" />
        </li>
      </ul>
    </UContainer>
  </div>
</template>

<script setup>
const { data: pages } = await useAsyncData('resources-articles', () => queryContent('/resources/articles').find())
</script>

<style scoped>
._ellipse {
  position: absolute;
  width: 480.14px;
  height: 161.22px;
  left: 0;
  top: 0;
  background: linear-gradient(97.62deg, rgba(0, 71, 225, 1) 2.27%, rgba(26, 214, 255, 1) 50.88%, rgba(0, 220, 130, 1) 98.48%);
  filter: blur(150px);
  transform: matrix(-0.97, 0.24, 0.24, 0.97, 0, 0);
}
</style>
