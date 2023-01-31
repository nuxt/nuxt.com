<template>
  <UContainer v-if="!error" padded class="pb-16 sm:pb-32">
    <ul role="list" class="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3 grid-auto-rows">
      <li v-for="article in articles" :key="article._path">
        <BlogPost :page="article" />
      </li>
    </ul>
  </UContainer>
  <UContainer v-else>
    <p class="text-center">
      Sorry an error occured while fetching the blog articles...
    </p>
  </UContainer>
</template>

<script setup lang="ts">
const { fetchList, articles } = useBlog()

const error = await fetchList()
</script>
