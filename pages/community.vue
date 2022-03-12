<script setup>
const { data: framework } = await useFetch('/api/community/framework')
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
            {{ framework.stats.stars }}
          </dd>
        </UCard>
        <UCard>
          <dt class="text-sm font-medium truncate u-text-gray-500">
            Members
          </dt>
          <dd class="mt-1 text-3xl font-semibold u-text-gray-900">
            {{ framework.stats.members }}
          </dd>
        </UCard>
        <UCard>
          <dt class="text-sm font-medium truncate u-text-gray-500">
            Activities
          </dt>
          <dd class="mt-1 text-3xl font-semibold u-text-gray-900">
            {{ framework.stats.activities }}
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
          <li v-for="c in framework.contributors" :key="c.github">
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
                    <a :href="`https://github.com/nuxt/framework/pulls?q=is%3Apr+author%3A${c.github}`" target="_blank" rel="noopener">
                      {{ c.activities }}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </UCard>
      <!-- <div class="inline-block max-w-full min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div class="overflow-hidden shadow ring-1 u-ring-gray-200 md:rounded-lg">
              <table class="min-w-full divide-y table-auto u-divide-gray-300">
                <thead class="u-bg-gray-50">
                  <tr>
                    <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold u-text-gray-900 sm:pl-6">
                      Name
                    </th>
                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold u-text-gray-900">
                      Social
                    </th>
                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold u-text-gray-900">
                      Role
                    </th>
                    <th scope="col" class="px-3 py-3.5 text-right text-sm font-semibold u-text-gray-900">
                      Activities
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y u-bg-white u-divide-gray-200">
                  <tr v-for="c in framework.contributors" :key="c.github">
                    <td class="py-4 pl-4 pr-3 text-sm whitespace-nowrap sm:pl-6">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 w-10 h-10">
                          <img class="w-10 h-10 rounded-full" :src="`https://github.com/${c.github}.png`" :alt="c.github">
                        </div>
                        <div class="ml-4">
                          <div class="font-medium u-text-gray-900">
                            {{ c.name }}
                          </div>
                          <div class="truncate u-text-gray-500">
                            {{ c.bio }}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-3 py-4 text-sm u-text-gray-500 whitespace-nowrap">
                      <div class="flex items-center justify-center flex-shrink-0 gap-3">
                        <a :href="`https://github.com/${c.github}`" class="hover:u-text-gray-900" target="_blank" rel="noopener"><UIcon name="fa-brands:github" class="h-4 flw-4" /></a>
                        <a v-if="c.twitter" :href="`https://twitter.com/${c.twitter}`" class="hover:u-text-gray-900" target="_blank" rel="noopener"><UIcon name="fa-brands:twitter" class="w-4 h-4" /></a>
                      </div>
                    </td>
                    <td class="px-3 py-4 text-sm u-text-gray-500 whitespace-nowrap">
                      <span v-if="c.roles.length" class="inline-flex px-2 text-xs font-semibold leading-5 text-green-800 bg-green-100 rounded-full">{{ c.roles[0] }}</span>
                    </td>
                    <td class="px-3 py-4 text-sm font-medium text-right whitespace-nowrap">
                      <a :href="`https://github.com/nuxt/framework/pulls?q=is%3Apr+author%3A${c.github}`" target="_blank" rel="noopener">
                        {{ c.activities }}
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div> -->
    </div>
  </Page>
</template>
