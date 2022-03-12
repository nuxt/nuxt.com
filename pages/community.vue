<script setup>
const { data: framework } = await useFetch('/api/community/framework')
</script>

<template>
  <Page>
    <div>
      <div class="sm:flex-auto">
        <h1 class="text-2xl font-semibold text-gray-900">
          Nuxt Community
        </h1>
        <p class="mt-2 text-sm text-gray-700">
          Discover the community and metrics around Nuxt.
        </p>
      </div>
      <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div class="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6">
          <dt class="text-sm font-medium text-gray-500 truncate">
            GitHub Stars
          </dt>
          <dd class="mt-1 text-3xl font-semibold text-gray-900">
            {{ framework.stats.stars }}
          </dd>
        </div>
        <div class="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6">
          <dt class="text-sm font-medium text-gray-500 truncate">
            Members
          </dt>
          <dd class="mt-1 text-3xl font-semibold text-gray-900">
            {{ framework.stats.members }}
          </dd>
        </div>
        <div class="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6">
          <dt class="text-sm font-medium text-gray-500 truncate">
            Activities
          </dt>
          <dd class="mt-1 text-3xl font-semibold text-gray-900">
            {{ framework.stats.activites }}
          </dd>
        </div>
      </dl>
    </div>
    <div class="mt-10">
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <h1 class="text-xl font-semibold text-gray-900">
            Contributors
          </h1>
          <p class="mt-2 text-sm text-gray-700">
            The people helping the framework getting better, everyday.
          </p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <!-- CTA -->
        </div>
      </div>
      <div class="mt-8 flex flex-col">
        <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table class="min-w-full divide-y divide-gray-300">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Name
                    </th>
                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Social
                    </th>
                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Role
                    </th>
                    <th scope="col" class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      Activities
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                  <tr v-for="c in framework.contributors" :key="c.github">
                    <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                      <div class="flex items-center">
                        <div class="h-10 w-10 flex-shrink-0">
                          <img class="h-10 w-10 rounded-full" :src="`https://github.com/${c.github}.png`" :alt="c.github">
                        </div>
                        <div class="ml-4">
                          <div class="font-medium text-gray-900">
                            {{ c.name }}
                          </div>
                          <div class="text-gray-500">
                            {{ c.bio }}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <a :href="`https://github.com/${c.github}`" target="_blank" rel="noopener"><UIcon name="fa-brands:github" class="flw-4 h-4" /></a>
                      <a v-if="c.twitter" :href="`https://twitter.com/${c.twitter}`" target="_blank" rel="noopener"><UIcon name="fa-brands:twitter" class="w-4 h-4" /></a>
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span v-if="c.roles.length" class="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">{{ c.roles[0] }}</span>
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-right font-medium">
                      <a :href="`https://github.com/nuxt/framework/pulls?q=is%3Apr+author%3A${c.username}`" target="_blank" rel="noopener">
                        {{ c.activities }}
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Page>
</template>
