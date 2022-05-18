<script setup>
const { data: nuxters } = await useFetch('/api/community/nuxters')
</script>

<template>
  <UContainer padded class="pt-12 pb-16 sm:pb-32">
    <div class="px-4 sm:flex sm:items-center sm:px-0">
      <div class="sm:flex-auto">
        <h1 class="text-xl font-semibold u-text-gray-900">
          Nuxters
        </h1>
        <p class="mt-2 text-sm u-text-gray-700">
          The people helping the framework getting better, everyday.
        </p>
      </div>
      <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
        <!-- CTA -->
      </div>
    </div>
    <UCard class="mt-8" body-class>
      <ul role="list" class="divide-y u-divide-gray-200">
        <li v-for="nuxter in nuxters" :key="nuxter.github">
          <div class="flex items-center px-4 py-4 sm:px-6">
            <div class="flex items-center flex-1 min-w-0">
              <UAvatar :src="`https://github.com/${nuxter.github}.png`" :alt="nuxter.github" class="flex-shrink-0" />
              <div class="grid flex-1 min-w-0 grid-cols-12 gap-8 px-4">
                <div class="col-span-6 sm:col-span-9">
                  <p class="text-sm font-medium truncate u-text-gray-900">
                    {{ nuxter.name }}
                  </p>
                  <p class="flex items-center mt-2 text-sm u-text-gray-500">
                    <span class="truncate">{{ nuxter.bio }}</span>
                  </p>
                </div>
                <div class="flex items-center justify-center flex-shrink-0 col-span-2 gap-3 sm:col-span-1">
                  <a :href="`https://github.com/${nuxter.github}`" class="hover:u-text-gray-900" target="_blank" rel="noopener"><UIcon name="fa-brands:github" class="w-5 h-5" /></a>
                  <a v-if="nuxter.twitter" :href="`https://twitter.com/${nuxter.twitter}`" class="hover:u-text-gray-900" target="_blank" rel="noopener"><UIcon name="fa-brands:twitter" class="w-5 h-5" /></a>
                </div>
                <div class="flex items-center justify-center flex-shrink-0 col-span-2 gap-3 sm:col-span-1">
                  <span v-if="nuxter.roles.length" class="inline-flex px-2 text-xs font-semibold leading-5 text-green-800 bg-green-100 rounded-full">{{ nuxter.roles[0] }}</span>
                </div>
                <div class="flex items-center justify-end flex-shrink-0 col-span-2 gap-3 sm:col-span-1">
                  {{ nuxter.activities }}
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </UCard>
  </UContainer>
</template>
