<template>
  <div ref="root" class="relative flex flex-col lg:flex-row min-h-[500px] items-center col-span-3 pl-8 lg:pl-0">
    <div class="h-full w-full h-[420px] w-[288px] sm:h-[490px] xl:w-[391px] xl:translate-x-[50px] 2xl:translate-x-[100px] border border-gray-600 bg-gray-900 rounded-md flex flex-col justify-between text-white p-4 xl:p-7">
      <span class="pb-5 text-sm font-semibold xl:text-base">blogArticle</span>
      <div class="flex flex-col pb-4">
        <span class="pb-1.5 text-sm font-semibold">banner</span>
        <div class="flex items-center justify-center bg-gray-800 border border-gray-600 rounded-md w-[128px] px-3 py-1.5">
          <span class="text-sm">assets/aurora.jpg</span>
        </div>
      </div>
      <div class="flex flex-col pb-4">
        <div class="relative flex flex-col w-full px-3 py-1.5 bg-gray-800 border border-gray-600 rounded-md">
          <span class="pb-1 text-sm font-semibold">title</span>
          <span class="text-sm">
            {{ `Intro${animatedTitle.word}` }}
          </span>

          <div class="absolute top-[28px] left-[16%] xl:left-[12%] text-teal-400">
            <span ref="titleCursor" class="absolute">|</span>
          </div>
          <div ref="titleUser" class="absolute flex items-center justify-center px-4 py-[1px] bg-teal-400 rounded-md left-[13%] top-[4px] z-[1]">
            <span class="text-white">droe</span>
          </div>
        </div>
      </div>
      <div class="relative flex flex-col px-3 py-1.5 mb-4 bg-gray-800 border border-gray-600 rounded-md">
        <div ref="descriptionUser" class="absolute flex items-center justify-center px-4 py-[1px] bg-indigoblue-400 rounded-md left-[11px] top-[4px] z-[1]">
          <span class="text-white text">atinux</span>
        </div>
        <div class="absolute text-indigoblue-400 left-[9px] top-[29px]">
          <span ref="descriptionCursor" class="absolute">|</span>
        </div>
        <span class="pb-1 text-sm font-semibold">description</span>
        <span class="text-sm">
          {{ `${animatedDescription.word} ac etiam consequat in. Convallis arcu ipsum urna nibh. Id orci tellus laoreet id ac.` }}
        </span>
      </div>
      <div>
        <span class="pb-1 text-sm font-semibold">link</span>
        <div class="grid items-center w-full grid-cols-2 py-2 pr-4 xl:pr-12 gap-x-4 gap-y-3">
          <span class="p-2 text-xs bg-gray-800 border border-gray-600 rounded-md xl:text-sm "><span class="font-semibold">text: </span>Read more</span>
          <span class="p-2 text-xs bg-gray-800 border border-gray-600 rounded-md xl:text-sm"><span class="font-semibold">src: </span>/blog/article</span>
          <span class="p-2 text-xs bg-gray-800 border border-gray-600 rounded-md xl:text-sm"><span class="font-semibold">icon: </span>right-arrow</span>
        </div>
      </div>
    </div>
    <div
      class="-translate-y-4 lg:translate-y-0 sm:absolute h-full w-full h-[300px] w-[250px] rounded-md text-gray-900 bg-gray-100/80 backdrop-blur-md
        -bottom-8 flex flex-col justify-between gap-y-3 xl:gap-y-5 p-6 xl:h-[402px] xl:w-[335px]
        sm:-bottom-[100px] sm:-right-24 md:-right-8 lg:-right-48 bottom-8 xl:top-[150px] xl:-right-[280px] 2xl:-right-[320px]"
    >
      <img src="/assets/home/projects-image.png" alt="projects image exemple">
      <h2 class="text-xl font-semibold xl:text-3xl ">
        {{ `Intro${animatedTitle.word}` }}
      </h2>
      <p class="text-xs xl:text-sm">
        {{ `${animatedDescription.word} ac etiam consequat in. Convallis arcu ipsum urna nibh. Id orci tellus laoreet id ac.` }}
      </p>
      <UButton
        label="Read more"
        icon="heroicons-solid:arrow-right"
        variant="transparant"
        trailing
        class="-translate-x-4"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'

const observer = ref() as Ref<IntersectionObserver>
const root = ref(null) as Ref<Element>

const title = 'ducting Nuxt'
const description = 'Id orci tellus laoreet id ac. '

const animatedTitle = reactive({ word: '' })
const animatedDescription = reactive({ word: '' })

const titleUser = ref(null)
const titleCursor = ref(null)
const descriptionCursor = ref(null)
const descriptionUser = ref(null)
const styleEl = ref(null)
const intervalIds = ref([])
const startAnimating = ref(false)

const observerCallback = (entries: IntersectionObserverEntry[]) =>
  entries.forEach((entry) => {
    if (entry.isIntersecting && !startAnimating.value) {
      startAnimating.value = true

      setTimeout(() => {
        animateWord(title.split(''), animatedTitle, titleCursor, titleUser, 7.3)

        setTimeout(() => {
          animateCursor(descriptionCursor)
          descriptionUser.value.style.opacity = '1'

          animateWord(description.split(''), animatedDescription, descriptionCursor, descriptionUser, 5.5)
        }, 500)
      }, 2000)
    }
  })

const animateWord = (letters, animatedText, cursorEl, nameEl, translateNb) => {
  letters.forEach((letter, index) => {
    setTimeout(() => {
      animatedText.word = animatedText.word + letter
      styleEl.value = `transform: translate(${index * translateNb}px)`
      cursorEl.value.style = styleEl.value
      nameEl.value.style = styleEl.value
    }, 100 * index)
  })
}

const animateCursor = (el) => {
  intervalIds.value.push(setInterval(() => {
    el.value.style.opacity = '1'
    setTimeout(() => {
      el.value.style.opacity = '0'
    }, 400)
  }, 800)
  )
}

onBeforeMount(() => (observer.value = new IntersectionObserver(observerCallback)))

onMounted(() => {
  animateCursor(titleCursor)

  observer.value.observe(root.value)

  descriptionCursor.value.style.opacity = '0'
  descriptionUser.value.style.opacity = '0'
})

onUnmounted(() => intervalIds.value?.map(id => clearInterval(id)))

</script>
