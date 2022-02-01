<template>
  <div>Navbar {{ user.email }}</div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { User } from '~/types'

const user = useStrapiUser() as Ref<User>
</script>
