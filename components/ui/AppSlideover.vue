<script setup lang="ts">
const { close } = useSlideover()

defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <ClientOnly>
    <teleport to="body">
      <div class="app-slideover">
        <div class="header">
          <slot name="header" />
        </div>
        <div>
          <slot />
        </div>
      </div>

      <div
        class="slideover-blur"
        @click.prevent="close()"
      />
    </teleport>
  </ClientOnly>
</template>

<style lang="ts" scoped>
css({
  '.app-slideover': {
    overflowY: 'hidden',
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 0%',
    width: '{size.full}',
    maxWidth: '{size.md}',
    backgroundColor: '{color.white}',
    borderRightWidth: '{size.1}',
    borderRightColor: '{color.gray.300}',
    transform: (props) => `${props.visible ? 'translateX(0px)' : 'translateX(-100%)'}`,

    '@dark': {
      backgroundColor: '{color.black}',
      borderRightColor: '{color.gray.700}',
    },

    '&:focus': {
      outline: 'none',
    },

    '.header': {
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      height: '{size.64}',
      px: '{size.16}',
      borderBottomWidth: '{size.1}',
      borderBottomColor: '{color.gray.200}',

      '@dark': {
        borderBottomColor: '{color.gray.800}',
      },

      '@sm': {
        px: '{size.24}'
      }
    },

    '&:last-child': {
      px: '{size.1}',
    }
  },

  '.slideover-blur': {
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 50,
    width: '100vh',
    height: '100vh',
    transition: 'all 0.1s',
    backdropFilter: (props) => `blur(${props.visible ? '12px' : '0px'})`,
    opacity: (props) => `${props.visible ? 100 : 0})`,
    pointerEvents: (props) => `${props.visible ? 'auto' : 'none'})`,
  }
})
</style>
