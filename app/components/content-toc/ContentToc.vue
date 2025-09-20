<script setup lang="ts">
interface TocLink {
  id: string
  depth: number
  text: string
  children?: TocLink[]
}

interface PageLink {
  label: string
  icon?: string
  to?: string
  target?: '_blank' | '_parent' | '_self' | '_top' | string
  external?: boolean
}

interface Props {
  links?: TocLink[]
  communityLinks: PageLink[]
}

defineProps<Props>()
</script>

<template>
  <UContentToc
    :links="links"
    v-bind="$attrs"
  >
    <template #bottom>
      <ContentTocBottom
        :has-links="!!links?.length"
        :community-links="communityLinks"
      />
    </template>
    <template v-for="(_, name) in $slots" #[name]="slotData" :key="name">
      <slot :name="name" v-bind="slotData" />
    </template>
  </UContentToc>
</template>
