<template>
  <div>
    <SubNavbar title="Resources" :links="links">
      <template #right>
        <UButton icon="fa-brands:twitter" variant="transparent" to="https://twitter.com/nuxt_js" target="_blank" class="!p-0" />
        <UButton icon="fa-brands:discord" variant="transparent" to="https://discord.com/invite/ps2h6QT" target="_blank" class="!p-0" />
        <UButton icon="fa-brands:github" variant="transparent" to="https://github.com/nuxt/framework" target="_blank" class="!p-0" />
      </template>
    </SubNavbar>

    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { findChildFromPath } from '~~/utils/content'

const navigation = inject('navigation')

const links = computed(() => findChildFromPath('/resources', navigation.value)?.children)
</script>
