<template>
  <div ref="anim">
    <ul class="flex">
      <li>
        <UButton variant="transparent" @click="activeCodeBlock = 'fromCLI'">
          From scratch
          <span v-if="activeCodeBlock === 'fromCLI'" class="absolute -bottom-1.5 left-0 h-0.5 bg-primary w-1/3" />
        </UButton>
      </li>
      <li>
        <UButton variant="transparent" @click="activeCodeBlock = 'fromScratch'">
          From CLI
          <span v-if="activeCodeBlock === 'fromScratch'" class="absolute -bottom-1.5 left-0 h-0.5 bg-primary w-1/3" />
        </UButton>
      </li>
    </ul>

    <!-- Code blocks -->
    <div class="mt-40 mb-40 lg:mt-0 lg:mb-0 w-full" :style="{ height: '300px' }">
      <div ref="codeBlock" class="relative">
        <Transition name="fade">
          <AnimFromCliCodeblock v-if="activeCodeBlock === 'fromCLI'" />
        </Transition>

        <Transition name="fade">
          <AnimFromScratchCodeblock v-if="activeCodeBlock === 'fromScratch'" />
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

const activeCodeBlock = ref('')
const anim = ref(null)
const codeBlock = ref(null)

onMounted(() => {
  animationObserver()
})

function animationObserver () {
  const callback = (entries) => {
    entries.forEach(({ _, isIntersecting }) => {
      if (isIntersecting) {
        activeCodeBlock.value = 'fromCLI'
      }
    })
  }

  const observer = new IntersectionObserver(callback, {
    root: anim.value
  })

  observer.observe(codeBlock)
}

</script>
