<template>
  <div class="grid grid-cols-12">
    <ul class="flex flex-col rounded-md col-span-5">
      <li
        v-for="(data, index) in architectureData.architecture"
        ref="sections"
        :key="data.title"
        class="flex flex-row gap-x-2 relative group p-4 hover:u-bg-gray-50 rounded-md transition duration-200"
        :class="counter === index ? 'u-bg-gray-50' : 'bg-none'"
      >
        <div
          class="rounded-md h-12 w-12 group-hover:opacity-0
         u-bg-gray-200 p-3 absolute left-0
         top-0 flex items-center justify-center transition duration-200 mt-4 ml-4"
          :class="{ 'opacity-0': counter === index }"
        >
          <img :src="`/docs/framework/v3/architecture/${data.icon}`" class="group-hover:opacity-0 transition duration-200" :class="{ 'opacity-0': counter === index }">
        </div>
        <div
          class="rounded-md h-12 w-12
          opacity-0 group-hover:opacity-100 p-3
          bg-gradient-to-b from-green-600 to-green-400 p-4
          absolute left-0 top-0 flex items-center justify-center transition duration-200 mt-4 ml-4"
          :class="counter === index ? 'opacity-100' : 'opacity-0'"
        >
          <img :src="`/docs/framework/v3/architecture/${data.iconColor}`" class="opacity-0 group-hover:opacity-100 transition duration-200" :class="counter === index ? 'opacity-100' : 'opacity-0'">
        </div>
        <div class="flex flex-col gap-y-2 pl-16">
          <h6 class="u-text-gray-900 text-lg font-semibold">
            {{ data.title }}
          </h6>
          <p class="u-text-gray-700">
            {{ data.description }}
          </p>
        </div>
      </li>
    </ul>
    <div class="col-span-7 flex items-end justify-center relative">
      <DocsFrameworkV3ArchitectureContainer class="w-full h-full" :class="counter === 3 ? 'transition-colors duration-500 delay-100 text-green-400': 'u-text-gray-100'" :opacity="counter === 3 ? 1 : 0.3" />
      <DocsFrameworkV3ArchitectureLayout :step="counter" :class="counter === 1 ? 'opacity-100' : 'opacity-0'" />
      <DocsFrameworkV3ArchitectureArticles :step="counter" />
      <DocsFrameworkV3ArchitectureMainArticle :step="counter" />
      <DocsFrameworkV3ArchitectureContent :step="counter" />
      <DocsFrameworkV3ArchitectureHeader :step="counter" />
    </div>
  </div>
</template>

<script setup lang="ts">
const sections = ref(null)
const counter = ref(0)
const article = ref(null)
const mainArticle = ref(null)
const leftContent = ref(null)
const header = ref(null)

onMounted(() => {
  counterSection()
})

function counterSection () {
  setInterval(function () {
    if (counter.value < 3) {
      counter.value++
    } else {
      counter.value = 0
    }
  }, 2500)
}

const { data: architectureData } = await useAsyncData('architecture', () => queryContent('/docs/framework/v3/collections/architecture').findOne())
</script>
