<template>
  <div>
    <SubNavbar title="Modules" :links="links">
      <template #right />
    </SubNavbar>

    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
const { links, fetchList } = useModules()

await fetchList()
</script>
