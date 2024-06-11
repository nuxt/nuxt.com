<script setup lang="ts">
const { footerLinks } = useNavigation()
</script>

<template>
  <UFooter
    :ui="{
      bottom: { wrapper: 'border-t border-gray-200 dark:border-gray-800', container: '!py-6' },
      top: { wrapper: 'border-t border-gray-200 dark:border-gray-800', container: 'py-8 lg:py-12' }
    }"
  >
    <template #top>
      <UFooterColumns :links="footerLinks">
        <template #right>
          <NewsletterForm />
        </template>
      </UFooterColumns>
    </template>

    <template #left>
      <p class="text-gray-500 dark:text-gray-400 text-sm">
        Copyright © 2016-{{ new Date().getFullYear() }} Nuxt - <NuxtLink class="hover:underline" to="https://go.nuxt.com/license" target="_blank">
          MIT License
        </NuxtLink>
      </p>
    </template>

    <template #right>
      <UButton aria-label="Nuxt on X" to="https://go.nuxt.com/x" target="_blank" icon="i-simple-icons-x" v-bind="($ui.button.secondary as any)" />
      <UButton aria-label="Nuxt on Discord" to="https://go.nuxt.com/discord" target="_blank" icon="i-simple-icons-discord" v-bind="($ui.button.secondary as any)" />
      <UButton aria-label="Nuxt on GitHub" to="https://go.nuxt.com/github" target="_blank" icon="i-simple-icons-github" v-bind="($ui.button.secondary as any)" />
    </template>
  </UFooter>
</template>
