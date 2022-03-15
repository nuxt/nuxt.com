<script setup>
import { sortBy } from 'lodash-es'

const { data: stats } = await useFetch('/api/community/stats')
const { data: contributors } = await useFetch('/api/community/contributors')
</script>

<template>
  <Page>
    <div>
      <div class="px-4 sm:px-0">
        <h1 class="text-2xl font-semibold u-text-gray-900">
          Nuxt Community
        </h1>
        <p class="mt-2 text-sm u-text-gray-700">
          Discover the community and metrics around Nuxt.
        </p>
      </div>
      <dl class="grid grid-cols-1 gap-5 mt-5 sm:grid-cols-3">
        <UCard>
          <dt class="text-sm font-medium truncate u-text-gray-500">
            GitHub Stars
          </dt>
          <dd class="mt-1 text-3xl font-semibold u-text-gray-900">
            {{ stats.stars }}
          </dd>
        </UCard>
        <UCard>
          <dt class="text-sm font-medium truncate u-text-gray-500">
            Members
          </dt>
          <dd class="mt-1 text-3xl font-semibold u-text-gray-900">
            {{ stats.contributors }}
          </dd>
        </UCard>
        <UCard>
          <dt class="text-sm font-medium truncate u-text-gray-500">
            Activities
          </dt>
          <dd class="mt-1 text-3xl font-semibold u-text-gray-900">
            {{ stats.activities }}
          </dd>
        </UCard>
      </dl>
    </div>
    <div class="mt-10">
      <div class="px-4 sm:flex sm:items-center sm:px-0">
        <div class="sm:flex-auto">
          <h1 class="text-xl font-semibold u-text-gray-900">
            Contributors
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
          <li v-for="c in contributors" :key="c.github">
            <div class="flex items-center px-4 py-4 sm:px-6">
              <div class="flex items-center flex-1 min-w-0">
                <UAvatar :src="`https://github.com/${c.github}.png`" :alt="c.github" class="flex-shrink-0" />
                <div class="grid flex-1 min-w-0 grid-cols-12 gap-8 px-4">
                  <div class="col-span-6 sm:col-span-9">
                    <p class="text-sm font-medium truncate u-text-gray-900">
                      {{ c.name }}
                    </p>
                    <p class="flex items-center mt-2 text-sm u-text-gray-500">
                      <span class="truncate">{{ c.bio }}</span>
                    </p>
                  </div>
                  <div class="flex items-center justify-center flex-shrink-0 col-span-2 gap-3 sm:col-span-1">
                    <a :href="`https://github.com/${c.github}`" class="hover:u-text-gray-900" target="_blank" rel="noopener"><UIcon name="fa-brands:github" class="w-5 h-5" /></a>
                    <a v-if="c.twitter" :href="`https://twitter.com/${c.twitter}`" class="hover:u-text-gray-900" target="_blank" rel="noopener"><UIcon name="fa-brands:twitter" class="w-5 h-5" /></a>
                  </div>
                  <div class="flex items-center justify-center flex-shrink-0 col-span-2 gap-3 sm:col-span-1">
                    <span v-if="c.roles.length" class="inline-flex px-2 text-xs font-semibold leading-5 text-green-800 bg-green-100 rounded-full">{{ c.roles[0] }}</span>
                  </div>
                  <div class="flex items-center justify-end flex-shrink-0 col-span-2 gap-3 sm:col-span-1">
                    {{ c.activities }}
                  </div>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </UCard>
    </div>
  </Page>
</template>
