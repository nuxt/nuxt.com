<script setup lang="ts">
import { NuxtLink } from '#components'
import type { BadgeProps } from '@nuxt/ui'

interface Props extends Omit<BadgeProps, 'label'> {
  /** A version number, or one of the {@link VERSION_KEYWORDS} like `unreleased` for something without a version yet. */
  version: string | VersionKeyword
  /** How far behind the latest release the requirement may be. Defaults to the whole current major. */
  tolerance?: VersionTolerance
  /** Overrides the release announcement or nightly guide the badge links to. */
  to?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: 'info',
  variant: 'subtle',
  size: 'md',
  // A page badge stays relevant for the whole major it documents
  tolerance: () => ({ major: 0 })
})

const { show, label, ariaLabel, to } = useVersionBadge(() => props.version, { tolerance: () => props.tolerance })

const link = computed(() => props.to ?? to.value)

const badgeProps = computed(() => {
  const { version, tolerance, to, ...rest } = props
  return rest
})
</script>

<template>
  <UBadge
    v-if="show"
    v-bind="badgeProps"
    :as="link ? NuxtLink : props.as"
    :to="link"
    :label="label"
    class="align-middle"
    :class="link && 'transition-opacity hover:opacity-75'"
    :aria-label="ariaLabel"
  />
</template>
