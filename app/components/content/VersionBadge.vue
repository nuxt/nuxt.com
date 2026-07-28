<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui'

interface Props extends Omit<BadgeProps, 'label'> {
  version: string
  /** How far behind the latest release the requirement may be. Defaults to the whole current major. */
  tolerance?: VersionTolerance
}

const props = withDefaults(defineProps<Props>(), {
  color: 'info',
  variant: 'subtle',
  size: 'md',
  // A page badge stays relevant for the whole major it documents
  tolerance: () => ({ major: 0 })
})

const { show, label } = useVersionBadge(() => props.version, { tolerance: () => props.tolerance })

const badgeProps = computed(() => {
  const { version, tolerance, ...rest } = props
  return rest
})
</script>

<template>
  <UBadge
    v-if="show"
    v-bind="badgeProps"
    :label="label"
    class="align-middle"
    :aria-label="`Minimum Nuxt Version: ${label}`"
  />
</template>
