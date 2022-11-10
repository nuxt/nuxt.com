<template>
  <div ref="root" class="relative flex flex-col lg:flex-row min-h-[500px] items-center col-span-3">
    <div class="h-[420px] w-[288px] sm:h-[490px] xl:w-[391px] xl:translate-x-[50px] 2xl:translate-x-[100px] border border-gray-800 bg-gray-900 rounded-md flex flex-col justify-between text-white p-4 xl:p-7">
      <span class="pb-5 text-sm font-semibold xl:text-base">blogArticle</span>
      <div class="flex flex-col pb-4">
        <span class="pb-1.5 text-sm font-semibold">banner</span>
        <div class="flex items-center justify-center bg-gray-800 border border-gray-700 rounded-md w-[128px] px-3 py-1.5">
          <span class="text-sm">assets/aurora.jpg</span>
        </div>
      </div>
      <div class="flex flex-col pb-4">
        <div class="relative flex flex-col w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-md">
          <span class="pb-1 text-sm font-semibold">title</span>
          <span class="relative text-sm">
            <div ref="highlightTitle" class="absolute top-0 left-[30px] h-5 bg-teal-400 opacity-30 transition-all" style="width: 0px" />
            {{ `Intro${animatedTitle.word}` }}
          </span>

          <div class="absolute top-[28px] left-[17%] xl:left-[13%] text-teal-400">
            <span ref="cursorTitle" class="absolute">|</span>
          </div>
          <div ref="userTitle" class="absolute flex items-center justify-center px-4 py-[1px] bg-teal-400 rounded-md left-[13%] top-[4px] z-[1]">
            <span class="text-white">droe</span>
          </div>
        </div>
      </div>
      <div class="relative flex flex-col px-3 py-1.5 mb-4 bg-gray-800 border border-gray-700 rounded-md">
        <div ref="userDescription" class="absolute flex items-center justify-center px-4 py-[1px] bg-indigoblue-400 rounded-md left-[11px] top-[4px] z-[1]">
          <span class="text-white text">atinux</span>
        </div>
        <div class="absolute text-indigoblue-400 left-[14px] top-[29px]">
          <span ref="cursorDescription" class="absolute">|</span>
        </div>
        <span class="pb-1 text-sm font-semibold">description</span>
        <span class="relative text-sm">
          <div ref="highlightDescription" class="absolute top-0 left-0 w-0 h-5 transition-all bg-indigoblue-400 opacity-30" />
          {{ `${animatedDescription.word} ac etiam consequat in. Convallis arcu ipsum urna nibh. Id orci tellus laoreet id ac.` }}
        </span>
      </div>
      <div>
        <span class="pb-1 text-sm font-semibold">link</span>
        <div class="grid items-center w-full grid-cols-2 py-2 pr-4 xl:pr-12 gap-x-4 gap-y-3">
          <span class="p-2 text-xs bg-gray-800 border border-gray-700 rounded-md xl:text-sm "><span class="font-semibold">text: </span>Read more</span>
          <span class="p-2 text-xs bg-gray-800 border border-gray-700 rounded-md xl:text-sm"><span class="font-semibold">src: </span>/blog/article</span>
          <span class="p-2 text-xs bg-gray-800 border border-gray-700 rounded-md xl:text-sm"><span class="font-semibold">icon: </span>right-arrow</span>
        </div>
      </div>
    </div>
    <div
      class="-translate-y-4 lg:translate-y-0 sm:absolute h-full w-full h-[300px] w-[250px] rounded-md text-gray-900 bg-gray-100/80 backdrop-blur-md
        -bottom-8 flex flex-col gap-y-3 xl:gap-y-5 p-6 xl:h-[402px] xl:w-[335px]
        sm:-bottom-[100px] sm:-right-24 md:-right-8 lg:-right-48 bottom-8 xl:top-[130px] xl:-right-[280px] 2xl:-right-[320px]"
    >
      <img src="/assets/home/projects-image.png" alt="projects image exemple">
      <h2 class="text-xl font-semibold xl:text-3xl ">
        {{ `Intro${animatedTitle.word}` }}
      </h2>
      <p class="flex-1 text-xs xl:text-sm">
        {{ `${animatedDescription.word} ac etiam consequat in. Convallis arcu ipsum urna nibh. Id orci tellus laoreet id ac.` }}
      </p>
      <UButton
        label="Read more"
        icon="uil:arrow-right"
        variant="transparent"
        icon-base-class="w-6 h-6"
        trailing
        class="-translate-x-4 !text-gray-900 focus-visible:ring-2"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'

const observer = ref() as Ref<IntersectionObserver>
const root = ref(null) as Ref<Element>

const title = 'ducing Nuxt'
const description = 'Id orci tellus laoreet id ac.'

const animatedTitle = reactive({ word: '' })
const animatedDescription = reactive({ word: '' })

const cursorTitle = ref(null)
const userTitle = ref(null)
const highlightTitle = ref(null)
const cursorDescription = ref(null)
const userDescription = ref(null)
const highlightDescription = ref(null)
const styleEl = ref(null)
const intervalIds = ref([])
const timeoutIds = ref([])

const observerCallback = (entries: IntersectionObserverEntry[]) =>
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      startAnimation()

      intervalIds.value.push(
        setInterval(() => {
          startAnimation()
        }, 8000)
      )
    } else {
      stopAnimation()
    }
  })

const startAnimation = () => {
  timeoutIds.value.push(
    setTimeout(() => {
      animateWord(title.split(''), animatedTitle, cursorTitle, userTitle, 7.3)

      timeoutIds.value.push(
        setTimeout(() => {
          animateCursor(cursorDescription)
          userDescription.value.style.opacity = '1'

          animateWord(description.split(''), animatedDescription, cursorDescription, userDescription, 5.5)
        }, 500)
      )

      timeoutIds.value.push(
        setTimeout(() => {
          animatedHightLight(75, highlightTitle, animatedTitle, cursorTitle, userTitle)
        }, 4000)
      )

      timeoutIds.value.push(
        setTimeout(() => {
          animatedHightLight(160, highlightDescription, animatedDescription, cursorDescription, userDescription)
        }, 5000)
      )
    }, 2000)
  )
}

const animateWord = (letters, animatedText, cursorEl, nameEl, translateNb) => {
  letters.forEach((letter, index) => {
    timeoutIds.value.push(
      setTimeout(() => {
        animatedText.word = animatedText.word + letter
        styleEl.value = `transform: translate(${index * translateNb}px)`
        cursorEl.value.style = styleEl.value
        nameEl.value.style = styleEl.value
      }, 100 * index)
    )
  })
}

const animatedHightLight = (pxWidth, highlightEl, animatedText, cursorEl, nameEl) => {
  highlightEl.value.style.width = `${pxWidth}px`
  highlightEl.value.style.transitionDuration = '1000ms'

  timeoutIds.value.push(
    setTimeout(() => {
      removeHighlight(highlightEl, animatedText, cursorEl, nameEl)
    }, 2000)
  )
}

const removeHighlight = (highlightEl, animatedText, cursorEl, nameEl) => {
  if (highlightEl.value) {
    highlightEl.value.style.width = '0px'
    highlightEl.value.style.transitionDuration = '0ms'
  }

  if (cursorEl.value) { cursorEl.value.style = 'transform: translate(-4px)' }
  if (nameEl.value) { nameEl.value.style = 'transform: translate(-4px)' }

  animatedText.word = ''
}

const animateCursor = (el) => {
  intervalIds.value.push(setInterval(() => {
    el.value.style.opacity = '1'
    timeoutIds.value.push(
      setTimeout(() => {
        if (!el.value) {
          return
        }
        el.value.style.opacity = '0'
      }, 400))
  }, 800)
  )
}

const stopAnimation = () => {
  intervalIds.value?.map(id => clearInterval(id))
  timeoutIds.value?.map(id => clearTimeout(id))
  intervalIds.value = []
  timeoutIds.value = []
  animatedTitle.word = ''
  animatedDescription.word = ''
  removeHighlight(highlightTitle, animatedTitle, cursorTitle, userTitle)
  removeHighlight(highlightDescription, animatedDescription, cursorDescription, userDescription)
}

onBeforeMount(() => (observer.value = new IntersectionObserver(observerCallback)))

onMounted(() => {
  animateCursor(cursorTitle)

  observer.value.observe(root.value)

  cursorDescription.value.style.opacity = '0'
  userDescription.value.style.opacity = '0'
})

onUnmounted(() => intervalIds.value?.map(id => clearInterval(id)))

</script>
