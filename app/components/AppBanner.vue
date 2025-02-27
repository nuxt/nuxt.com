<script setup lang="ts">
const props = defineProps<{
  id: number | string
  title?: string
  icon?: string
  to?: string
  actions?: any
}>()

const id = `hide-banner-${props.id}`

const hideBanner = () => {
  localStorage.setItem(id, 'true')

  document.querySelector('html')?.classList.add('hide-banner')
}

if (import.meta.server) {
  useServerHead({
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
  <UBanner
    :to="to"
    :title="title"
    :icon="icon"
    :actions="actions"
    class="app-banner hover:bg-(--ui-primary)/90"
  >
    <template #close>
      <UButton
        aria-label="Close banner"
        icon="i-heroicons-x-mark-20-solid"
        @click.prevent="hideBanner"
      />
    </template>
  </UBanner>
</template>

<style scoped>
.hide-banner .app-banner {
  display: none;
}
</style>
