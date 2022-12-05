<template>
  <div> {{ data }} </div>
</template>

<script setup lang="ts">

const { data } = await useAsyncData('baise', () => queryContent('/docs/community/contributors').findOne())

</script>
