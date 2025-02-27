<script setup lang="ts">
const { footerLinks } = useNavigation()
</script>

<template>
  <UFooter>
    <template #top>
      <UFooterColumns :columns="footerLinks">
        <template #right>
          <NewsletterForm />
        </template>
      </UFooterColumns>
    </template>

    <template #left>
      <p class="text-(--ui-text-muted) text-sm">
        Copyright © 2016-{{ new Date().getFullYear() }} Nuxt - <NuxtLink class="hover:underline" to="https://go.nuxt.com/license" target="_blank">
          MIT License
        </NuxtLink>
      </p>
    </template>

    <template #right>
      <UButton
        color="neutral"
        variant="ghost"
        aria-label="Nuxt on X"
        to="https://go.nuxt.com/x"
        target="_blank"
        icon="i-simple-icons-x"
      />
      <UButton
        color="neutral"
        variant="ghost"
        aria-label="Nuxt on BlueSky"
        to="https://go.nuxt.com/bluesky"
        target="_blank"
        icon="i-simple-icons-bluesky"
      />
      <UButton
        color="neutral"
        variant="ghost"
        aria-label="Nuxt on LinkedIn"
        to="https://go.nuxt.com/linkedin"
        target="_blank"
        icon="i-simple-icons-linkedin"
      />
      <UButton
        color="neutral"
        variant="ghost"
        aria-label="Nuxt on Discord"
        to="https://go.nuxt.com/discord"
        target="_blank"
        icon="i-simple-icons-discord"
      />
      <UButton
        color="neutral"
        variant="ghost"
        aria-label="Nuxt on GitHub"
        to="https://go.nuxt.com/github"
        target="_blank"
        icon="i-simple-icons-github"
      />
    </template>
  </UFooter>
</template>
