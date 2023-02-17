<template>
  <button @click="count++">
    {{ count }}
  </button>
</template>

<script setup>
data({
  counter: 0
})
</script>
