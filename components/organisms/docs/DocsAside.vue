<template>
  <nav>
    <div ref="navigationContainer">
      <transition mode="out-in" :css="false" @enter="onEnter" @leave="onLeave">
        <ul class="flex flex-col overflow-hidden gap-y-4">
          <DocsAsideItem
            v-for="item in links"
            :key="item.label"
            :item="item"
          />
        </ul>
      </transition>
    </div>
  </nav>
</template>
<script setup lang="ts">
defineProps({
  links: {
    type: Array,
    default: () => []
  }
})

const navigationContainer = ref<HTMLElement>()

const { onLeave, onEnter } = useNavigationMotion(navigationContainer)
</script>
