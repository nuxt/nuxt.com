<template>
  <UContainer padded class="py-12">
    <div class="flex flex-col-reverse md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      <div class="flex flex-col space-y-5 lg:col-span-2 justify-center py-8">
        <h1 class="font-semibold text-5xl u-text-gray-900">
          <Markdown use="title" unwrap="p" />
        </h1>
        <p class="font-medium text-lg u-text-gray-500 max-w-xl">
          <Markdown use="description" unwrap="p" />
        </p>

        <UInput
          v-model="q"
          name="search"
          placeholder="Search an integration"
          class="w-full max-w-sm"
          custom-class=" !u-bg-gray-50"
          size="lg"
          icon="heroicons-outline:search"
          autocomplete="off"
        />
      </div>

      <div class="flex items-center justify-center lg:col-span-1 relative">
        <img src="/gems.svg" class="h-[280px]">

        <UCard body-class="p-4" class="absolute left-11 top-3 w-44 backdrop-blur-lg !bg-opacity-10">
          <UIcon name="heroicons-outline:download" class="w-5 h-5 text-teal-400" />

          <p class="u-text-gray-900 font-semibold text-4xl mb-2">
            {{ stats.modules }}
          </p>
          <p class="text-xs u-text-gray-500">
            Downloads Last 30 Days
          </p>
        </UCard>

        <UCard body-class="p-4" class="absolute -left-10 bottom-0 w-32 backdrop-blur-lg !bg-opacity-10">
          <UIcon name="heroicons-outline:puzzle" class="w-5 h-5 text-green-400" />

          <p class="u-text-gray-900 font-semibold text-4xl mb-2">
            {{ stats.modules }}
          </p>
          <p class="text-xs u-text-gray-500">
            Modules
          </p>
        </UCard>

        <UCard body-class="p-4" class="absolute right-0 -bottom-10 w-32 backdrop-blur-lg !bg-opacity-10">
          <UIcon name="heroicons-outline:users" class="w-5 h-5 text-indigoblue-600" />

          <p class="u-text-gray-900 font-semibold text-4xl mb-2">
            {{ stats.contributors }}
          </p>
          <p class="text-xs u-text-gray-500">
            Contributors
          </p>
        </UCard>
      </div>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const { stats } = useModules()

const q = computed({
  get () {
    return route.query.q
  },
  set (q) {
    router.push({
      name: 'integrations',
      query: {
        ...route.query,
        q: q || undefined
      },
      params: {
        stop: 'true'
      }
    })
  }
})
</script>
