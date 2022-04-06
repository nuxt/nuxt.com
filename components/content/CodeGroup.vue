<script lang="ts">
import TabsHeader from './TabsHeader.vue'

const isTag = (slot: any, tag: string) => {
  return slot.type && slot.type.tag && slot.type.tag === tag
}

export default defineComponent({
  data () {
    return {
      activeTabIndex: 0,
      /**
       * A simple number that increases on every changes
       */
      counter: 0
    }
  },
  render () {
    const slots = this.$slots.default()
    const tabs = slots
      .filter(
        slot =>
          isTag(slot, 'code-block') ||
            isTag(slot, 'code')
      )
      .map((slot, index) => {
        return {
          label: slot?.props?.filename || slot?.props?.label || `${index}`,
          active: slot?.props?.active || false,
          component: slot
        }
      })

    return h(
      'div',
      {
        class: {
          'code-group': true,
          'first-tab': this.activeTabIndex === 0
        }
      },
      [
        h(
          TabsHeader,
          {
            ref: 'tabs-header',
            activeTabIndex: this.activeTabIndex,
            tabs,
            'onUpdate:activeTabIndex': $event => (this.activeTabIndex = $event)
          }
        ),
        h(
          'div',
          {
            class: 'code-group-content',
            text: this.activeTabIndex
          },
          // Map slots to content children
          slots.map(
            (slot, index) => h(
              'div',
              {
                // Current slot is displayed, others are hidden
                style: { display: index === this.activeTabIndex ? 'block' : 'none' }
              },
              // Display direct children if not a ```code``` block
              [isTag(slot, 'code') ? slot : slot.children.default()]
            )
          )
        )
      ]
    )
  }
})
</script>

<style>
.prose {
  li {
    .code-group {
      @apply my-4;
    }
  }
}
</style>

<style scoped lang="postcss">
.code-group {
  :deep(.prose-code) {
    @apply mt-0 !important;
  }
  :deep(pre) {
    @apply rounded-tl-none rounded-tr-none mt-0 !important;
  }
}
</style>
