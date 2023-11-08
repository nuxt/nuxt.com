<script lang="ts" setup>
const route = useRoute()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())

const title = page.value.head?.title || page.value.title
const description = page.value.head?.description || page.value.description

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
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page">
      <template #links>
        <CopyButton text="npx nuxi@latest init my-app" />
      </template>
    </UPageHero>

    <UPageGrid :ui="{ wrapper: 'grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8 py-8' }">
      <UPageCard v-for="(theme, index) in page.themes" :key="theme.name" :ui="{ body: { padding: '' } }">
        <li class="relative w-full h-full flex justify-center items-center p-[1px]">
          <div class="w-full h-full text-xs card rounded-xl z-10 grid grid-cols-1">
            <div class="relative h-[300px]">
              <NuxtImg
                :src="theme.image"
                class="w-full rounded-t-xl object-cover h-[300px]"
                alt=""
                sizes="sm:300px lg:600px"
                width="1112"
                height="617"
                format="webp"
                :loading="index > 1 ? 'lazy' : undefined"
              />

              <div class="h-[5px] w-full line flex justify-between -mt-[1px] z-10">
                <span class="h-[5px] w-full bg-gradient-to-l from-transparent to-slate-950/90" />
                <span class="h-[5px] w-full bg-gradient-to-r from-transparent to-slate-950/90" />
              </div>
              <div
                v-if="theme.demo"
                class="absolute inset-0 w-full h-full bg-gradient-to-b from-transparent to-gray-950/80 flex justify-center"
              >
                <div class="absolute bottom-6 left-0 right-0  flex justify-center group">
                  <UButton
                    label="preview"
                    icon="i-ph-arrow-up-right-bold"
                    :to="theme.demo"
                    size="sm"
                    target="_blank"
                    :trailing="true"
                    color="gray"
                    :ui="{ icon: { size: { sm: 'w-4 h-4' } } }"
                  />
                </div>
              </div>
            </div>

            <div
              class="flex flex-col gap-y-4 items-center w-full py-4 px-5 sm:py-[40px] sm:px-[60px] md:p-6 lg:py-[40px] lg:px-[60px]"
            >
              <div class="flex flex-col justify-start gap-y-4">
                <div v-if="!theme.shop" class="flex gap-x-2 items-center justify-center">
                  <UButton
                    target="_blank"
                    :to="`https://github.com/${theme.repo}/tree/${theme.branch}`"
                    size="xs"
                    class="flex gap-x-4 transition-colors duration-200 items-center justify-center"
                    variant="ghost"
                    color="gray"
                  >
                    <span class="text-gray-950 dark:text-white font-bold text-2xl">{{ theme.name }}</span>

                    <UIcon name="i-simple-icons-github" class="h-5 w-5" />
                  </UButton>
                  <UBadge v-if="theme.free" color="green" variant="solid" label="Free" :ui="{ rounded: 'rounded-full' }" />
                </div>

                <span v-else class="text-white font-bold text-2xl text-center">{{ theme.name }}</span>

                <p class="text-center text-lg text-gray-500 dark:text-gray-400 -mt-4 pb-3">
                  {{ theme.description }}
                </p>
              </div>

              <div v-if="!theme.shop" class="flex flex-col gap-y-4">
                <UPageGrid
                  :ui="{ wrapper: `grid grid-cols-1 lg:grid-cols-4 justify-between w-full gap-3 ${ theme.studio ? 'xl:grid-cols-3' : 'xl:grid-cols-2' }` }"
                >
                  <UButton
                    target="_blank"
                    :to="`https://codesandbox.io/s/github/${theme.repo}/tree/${theme.branch}/${theme.dir || ''}`"
                    color="gray"
                    label="CodeSandbox"
                    icon="i-simple-icons-codesandbox"
                    class="lg:col-span-2 xl:col-span-1 flex justify-center items-center"
                    size="sm"
                    :ui="{ icon: { size: { sm: 'w-4 h-4' } } }"
                  />

                  <UButton
                    target="_blank"
                    :to="`https://stackblitz.com/github/${theme.repo}/tree/${theme.branch}/${theme.dir || ''}`"
                    label="StackBlitz"
                    color="gray"
                    icon="i-simple-icons-stackblitz"
                    class="lg:col-span-2 xl:col-span-1 flex justify-center items-center"
                    size="sm"
                  />

                  <UButton
                    v-if="theme.studio"
                    target="_blank"
                    :to="`https://nuxt.studio/themes/${theme.slug}`"
                    label="Studio"
                    icon="i-simple-icons-nuxtdotjs"
                    color="gray"
                    class="lg:col-span-4 xl:col-span-1 flex justify-center items-center"
                    size="sm"
                    :ui="{ icon: { base: 'flex-shrink-0 text-cyan-500' } }"
                  />
                </UPageGrid>

                <CopyButton
                  :text="`npx nuxi init -t themes/${theme.slug} <app>`"
                  class="w-full"
                  background="bg-gradient-to-b from-gray-50 to-gray-100 hover:to-gray-200 lg:hover:to-gray-100
                   dark:from-gray-900 dark:to-gray-950 dark:hover:to-gray-800 dark:lg:hover:to-gray-900"
                  size="sm"
                />
              </div>

              <UButton
                v-else
                target="_blank"
                :to="theme.shop"
                color="gray"
                label="Buy it now"
                icon="i-ph-arrow-up-right-bold"
                :trailing="true"
                size="sm"
                :ui="{ icon: { size: { sm: 'w-4 h-4' } } }"
                class="w-full flex justify-center items-center"
              />
            </div>
          </div>
          <div class="absolute card-bg inset-0 w-full h-full z-[-1] rounded-xl" />
        </li>
      </UPageCard>
    </UPageGrid>

    <div class="pt-[60px] mb-[120px] gap-y-[60px]">
      <UPageHero v-bind="page.further" />
      <UPageGrid :ui="{ wrapper: 'grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 rounded-xl border border-gray-800 w-full gap-0' }">
        <UPageCard
          v-for="(item, index) in page.further.items"
          :key="index"
          :to="item.to"
          target="_blank"
          class="transition-colors duration-200 hover:!ring-0 dark:hover:ring-0"
          :class="{ 'border-t border-b md:border-b-0 md:border-t-0 md:border-l md:border-r border-gray-800': index === 1 }"
          :ui="{ body: { padding: 'px-4 sm:p-6 md:p-8' }, ring: '',
                 rounded: `${ index === 1 ? '' : 'first:rounded-b-none md:first:rounded-l-xl md:first:rounded-r-none first:hover:rounded-t-xl md:first:hover:rounded-tr-none md:first:hover:rounded-l-xl last:hover:rounded-b-xl last:rounded-t-none md:last:rounded-l-none md:last:rouned-r-xl md:last:rounded-tr-xl md:last:hover:rounded-r-xl md:last:hover:rounded-bl-none md:last:hover:rounded-tl-none' }` }"
        >
          <div class="flex justify-between items-center">
            <h3 class="text-gray-950 dark:text-white font-bold text-xl">
              {{ item.title }}
            </h3>
            <UIcon name="i-ph-arrow-right-light" class="w-5 h-5 self-start text-gray-600 dark:text-gray-400 group-hover:translate-x-2 transition-translate duration-200" />
          </div>
          <p class="text-gray-400">
            {{ item.description }}
          </p>
        </UPageCard>
      </UPageGrid>
    </div>
  </UContainer>
</template>

<style lang="postcss">
.line {
  background: linear-gradient(rgba(0, 220, 130, 0), rgba(19, 223, 162, 1), rgba(54, 228, 218, 1), rgba(54, 228, 218, 0))
}
</style>
