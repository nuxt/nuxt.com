<template>
  <div class="flex flex-row-reverse">
    <AppAvatar
      v-if="remainingGroupSize > 0"
      :size="size"
      :text="`+${remainingGroupSize}`"
      :class="avatarClass"
    />
    <AppAvatar
      v-for="(avatar, index) of displayedGroup"
      :key="index"
      v-bind="avatar"
      :size="size"
      :class="avatarClass"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, PropType } from 'vue'
import { classNames } from '../../utils'

const props = defineProps({
  group: {
    type: Array,
    default: () => []
  },
  size: {
    type: String as PropType<'xxxs' | 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'>,
    default: 'md'
  },
  max: {
    type: Number,
    default: null
  }
})

const avatars = computed(() => {
  return props.group.map((avatar) => {
    return typeof avatar === 'string' ? { src: avatar } : avatar
  })
})

const displayedGroup = computed(() => {
  if (!props.max) { return [...avatars.value].reverse() }

  return avatars.value.slice(0, props.max).reverse()
})

const remainingGroupSize = computed(() => {
  if (!props.max) { return 0 }

  return avatars.value.length - props.max
})

const avatarClass = computed(() => {
  return classNames(
    props.ringClass,
    props.marginClass
  )
})
</script>
