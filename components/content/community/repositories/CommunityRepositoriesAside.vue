<template>
  <nav>
    <div class="py-1.5 flex items-center gap-3">
      <p class="font-semibold u-text-gray-900">
        Repositories
      </p>
    </div>

    <ul v-if="organizations.length" class="py-3">
      <li v-for="organization in organizations" :key="organization.key">
        <NuxtLink
          :to="organization.to"
          class="py-1.5 block relative"
          :class="{
            'u-text-gray-900 font-medium': selectedOrganization?.key === organization.key,
            'u-text-gray-500 hover:u-text-gray-900 focus:u-text-gray-900': selectedOrganization?.key !== organization.key
          }"
        >
          <span class="relative">
            <img :src="`https://github.com/${organization.key}.png`" class="inline-block w-4 h-4 mb-1 mr-1.5 rounded grayscale">

            <span>{{ organization.title }}</span>

            <span
              v-if="selectedOrganization?.key === organization.key"
              class="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-green-400 via-teal-400 to-indigoblue-600"
            />
          </span>
        </NuxtLink>
      </li>
    </ul>

    <div class="py-3 border-t u-border-gray-200">
      <NuxtLink
        to="https://github.com/nuxt/framework"
        target="_blank"
        class="flex items-center gap-1.5 hover:u-text-gray-900 focus:u-text-gray-900 text-sm font-medium"
      >
        <UIcon name="fa-brands:github" class="w-4 h-4" />
        Star us on GitHub
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
const { organizations, selectedOrganization } = useCommunityRepositories()
</script>
