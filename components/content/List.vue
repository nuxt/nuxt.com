<script lang="ts">
import type { ComputedRef, PropType, Ref } from 'vue'
import { Icon } from '#components'

const iconTypeMap = {
  primary: 'heroicons-outline:check',
  info: 'heroicons-outline:information-circle',
  success: 'heroicons-outline:check-circle',
  warning: 'heroicons-outline:exclamation',
  danger: 'heroicons-outline:exclamation-circle'
} as any

export default defineComponent({
  props: {
    /**
     * Used to override the default <code>type</code> icon, check out the
     *  <a href="https://github.com/nuxt/content/tree/dev/packages/theme-docs/src/components/global/icons">icons available</a>
     */
    icon: {
      type: String,
      default: null
    },
    /**
     * Type of list
     */
    type: {
      type: String as PropType<'primary', 'info', 'success', 'warning', 'danger', 'default'>,
      default: 'primary'
    }
  },
  setup (props) {
    const slots = useSlots()

    const { flatUnwrap, unwrap } = useUnwrap()

    const iconName: ComputedRef<any> = computed(() => props.icon || iconTypeMap[props.type])

    // Usage of render function is mandatory to access default slot
    // Otherwise Vue warns that slot "default" was invoked outside of the render function
    return () => {
      const items = flatUnwrap((slots.default && slots.default()) ?? [], ['ul']).map(li => unwrap(li, ['li']))

      return h(
        'ul',
        items.map(item =>
          h('li', { class: 'mb-3 flex items-center' }, [
            h('span', { class: `list-${props.type} mt-px mr-3 flex-shrink-0` }, h(Icon, { name: iconName.value, class: 'h-6 w-6' })),
            h('span', h(resolveComponent('ContentSlot'), { use: () => item }))
          ])
        )
      )
    }
  }
})
</script>

<style lang="postcss">
/* Primary */
.list-primary {
  @apply text-primary-500;
}
/* Info */
.list-info {
  @apply text-blue-500 dark:text-blue-400;
}
/* Success */
.list-success {
  @apply text-green-500 dark:text-green-400;
}
/* Warning */
.list-warning {
  @apply text-yellow-500 dark:text-yellow-400;
}
/* Danger */
.list-danger {
  @apply text-red-500 dark:text-red-400;
}
.list-default {
  @apply text-gray-500 dark:text-gray-200;
}
</style>
