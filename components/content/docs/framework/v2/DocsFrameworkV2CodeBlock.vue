<template>
  <div ref="codeBlockAnim" class="w-full pt-8 pb-16">
    <ul class="flex">
      <li>
        <UButton variant="transparent" @click="cliActive = false">
          <span class="text-base" :class="{ 'font-semibold u-text-gray-900': !cliActive }">From scratch</span>
        </UButton>
      </li>
      <li>
        <UButton variant="transparent" @click="cliActive = true">
          <span class="text-base" :class="{ 'font-semibold u-text-gray-900': cliActive }">From CLI</span>
        </UButton>
      </li>
    </ul>

    <!-- Code blocks -->
    <div class="mt-40 mb-40 lg:mt-0 lg:mb-0 w-full h-[300px]">
      <div ref="codeBlock" class="relative">
        <Transition name="fade">
          <DocsFrameworkV2CodeBlockCLI v-if="cliActive" />
        </Transition>

        <Transition name="fade">
          <DocsFrameworkV2CodeBlockFromScratch v-if="!cliActive" />
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'

const observer = ref() as Ref<IntersectionObserver>
const codeBlockAnim = ref(null)
const codeBlock = ref(null)
const cliActive = ref(false)

const observerCallback = (entries: IntersectionObserverEntry[]) =>
  entries.forEach(({ isIntersecting }) => {
    if (isIntersecting) {
      cliActive.value = true
    }
  })

onMounted(() => {
  observer.value.observe(codeBlock.value)
})

// Create intersection observer
onBeforeMount(() => (observer.value = new IntersectionObserver(observerCallback, { root: codeBlockAnim.value })))

// Destroy it
onBeforeUnmount(() => observer.value?.disconnect())
</script>
