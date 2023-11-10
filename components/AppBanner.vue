<script setup lang="ts">
const props = defineProps<{
  id: number
  to: string
}>()

const id = `hide-banner-${props.id}`

const hideBanner = () => {
  localStorage.setItem(id, 'true')

  document.querySelector('html')?.classList.add('hide-banner')
}

if (process.server) {
  useHead({
    script: [
      {
        key: 'prehydrate-template-banner',
        innerHTML: `
            if (localStorage.getItem('${id}') === 'true') {
              document.querySelector('html').classList.add('hide-banner')
            }`.replace(/\s+/g, ' '),
        type: 'text/javascript'
      }
    ]
  })
}
</script>

<template>
  <NuxtLink :to="to" target="_blank" class="relative w-full z-50 border-b border-gray-200 dark:border-gray-800 app-banner flex items-center justify-center">
    <div class="flex flex-wrap justify-center items-center gap-3 h-12 text-sm">
      <slot />
    </div>

    <UButton
      color="gray"
      variant="link"
      size="sm"
      icon="i-ph-x"
      class="right-4 absolute"
      @click.prevent="hideBanner"
    />
  </NuxtLink>
</template>

<style scoped>
.hide-banner .app-banner {
  display: none;
}
</style>
