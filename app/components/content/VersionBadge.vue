<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui'

interface Props extends Omit<BadgeProps, 'label'> {
  version: string
}

const props = withDefaults(defineProps<Props>(), {
  color: 'info',
  variant: 'subtle',
  size: 'md'
})

const { version: docsVersion } = useDocsVersion()

const label = computed(() => props.version?.trim())

const show = computed(() => {
  if (!label.value) return false

  const major = Number.parseInt(label.value, 10)
  const docsMajor = Number.parseInt(docsVersion.value?.shortTag.slice(1) ?? '', 10)
  return !Number.isNaN(major) && !Number.isNaN(docsMajor) && major >= docsMajor
})

const badgeProps = computed(() => {
  const { version, ...rest } = props
  return rest
})
</script>

<template>
  <UBadge
    v-if="show"
    v-bind="badgeProps"
    :label="`v${label}`"
    class="align-middle"
    :aria-label="`Minimum Nuxt Version: v${label}`"
  />
</template>
