<script setup>
const { data: stats } = await useFetch('/api/community/stats')
</script>

<template>
  <Page>
    <!-- TODO: transform to components and use in Markdown -->
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
            Nuxters
          </dt>
          <dd class="mt-1 text-3xl font-semibold u-text-gray-900">
            <NuxtLink to="/community/nuxters">
              {{ stats.contributors }}
            </NuxtLink>
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
  </Page>
</template>
