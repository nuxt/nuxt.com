<template>
  <div>
    <SubNavbar title="Company" :links="links">
      <template #right>
        <!-- CTA -->
      </template>
    </SubNavbar>

    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
const { navFromPath } = usePage()

const links = computed(() => navFromPath('/company')?.children)
</script>
