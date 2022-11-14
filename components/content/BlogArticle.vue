<script setup>
defineProps({
  authors: {
    type: Array,
    default: () => []
  },
  date: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <Page>
    <ProseH1>
      <slot name="title" />
    </ProseH1>
    <slot name="description" />
    <div class="flex">
      <div v-for="author in authors" :key="author.name">
        <NuxtLink :to="author.link" target="_blank" class="block flex items-center justify-end -ml-2 sm:ml-0 sm:mr-2">
          <UAvatar
            rounded
            :src="author.avatarUrl"
          />
          {{ author.name }}
        </NuxtLink>
      </div>
      <slot name="body" />
    </div>
  </Page>
</template>
