<template>
  <div>
    <SubNavbar title="Resources" :links="links">
      <template #right>
        <!-- CTA -->
      </template>
    </SubNavbar>

    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
const { navFromPath } = usePage()

const links = computed(() => navFromPath('/resources')?.children)
</script>
