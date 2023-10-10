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
        Copyright © 2016-{{ new Date().getFullYear() }} Nuxt - MIT License
      </p>
    </template>

    <template #right>
      <UButton to="https://x.com/nuxt_js" target="_blank" icon="i-simple-icons-x" v-bind="($ui.button.secondary as any)" />
      <UButton to="https://discord.com/invite/ps2h6QT" target="_blank" icon="i-simple-icons-discord" v-bind="($ui.button.secondary as any)" />
      <UButton to="https://github.com/nuxt/nuxt" target="_blank" icon="i-simple-icons-github" v-bind="($ui.button.secondary as any)" />
    </template>
  </UFooter>
</template>

<script setup lang="ts">
const { footerLinks } = useNavigation()
</script>
