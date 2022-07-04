<template>
  <div
    ref="ctaContainer"
    class="relative pt-10 pb-40 transition duration-700 sm:pt-44 sm:px-0 md:pt-28 lg:pt-40"
    :class="!slideIn ? 'opacity-0 translate-y-20' : 'opacity-100 translate-y-0'"
  >
    <div ref="mouseLight" class="absolute top-0 rounded-full blur-[50px] bg-gradient-to-t from-green-400 via-teal-400 to-indigoblue-400" />

    <UContainer padded class="relative flex flex-col items-center justify-center gap-y-6">
      <h3 class="text-4xl font-semibold u-text-gray-900">
        <Markdown :use="$slots.title" unwrap="p" />
      </h3>
      <p class="max-w-xl text-xl text-center u-text-gray-900">
        <Markdown :use="$slots.description" unwrap="p" />
      </p>
      <form ref="root" class="flex flex-wrap justify-start justify-center w-full gap-6 sm:flex-nowrap" @submit.prevent="onSubmit">
        <div ref="inputForm">
          <UInput
            v-model="form.email"
            name="email"
            placeholder="Enter your email"
            class="w-full sm:w-64"
            size="lg"
            required
          />
        </div>
        <UButton
          type="submit"
          submit
          variant="primary-gradient"
          :loading="loading"
          :label="buttonText"
          size="lg"
        />
      </form>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'

defineProps({
  buttonText: {
    type: String,
    default: ''
  }
})

const observer = ref() as Ref<IntersectionObserver>
const root = ref(null) as Ref<Element>
const slideIn = ref(false)
const mouseLight = ref(null)
const ctaContainer = ref(null)
const inputForm = ref(null)

const observerCallback = (entries: IntersectionObserverEntry[]) =>
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      slideIn.value = true
      ctaContainer.value.addEventListener('mousemove', (e) => { mouseMoveLight(e) })
    }
  })

const { $toast } = useNuxtApp()

const form = reactive({
  email: ''
})
const loading = ref(false)

async function onSubmit () {
  loading.value = true

  // TODO: handle already subscribed case
  // FIXME: cannot retry call (uses fetch caching) (waiting for module update)
  const { error } = await useNewsletterSubscribe(form.email)
  if (!error.value) {
    $toast.success({ title: 'Subscription succeed', description: 'You have been successfully subscribed to Nuxt newsletter. Please check your emails to confirm your subscription.' })
  } else {
    $toast.error({ title: 'Subscription failed', description: 'Something went wrong. Please try again later.' })
  }

  loading.value = false
}

const mouseMoveLight = (e) => {
  const refNumber = 1000
  const input = inputForm.value.getBoundingClientRect()
  const x = e.clientX - (input.left + (inputForm.value.clientWidth / 2))
  const y = e.clientY - (input.top + (inputForm.value.clientHeight / 2))
  const coord = Math.abs(y) + Math.abs(x)
  const size = refNumber - coord

  mouseLight.value.style.top = `${e.clientY - ctaContainer.value.getBoundingClientRect().y - mouseLight.value.clientHeight / 2}px`
  mouseLight.value.style.left = `${e.clientX - mouseLight.value.clientWidth / 2}px`

  mouseLight.value.style.width = `${(size / 3)}px`
  mouseLight.value.style.height = `${(size / 3)}px`

  if (e.clientY < ctaContainer.value.getBoundingClientRect().y) {
    mouseLight.value.style.visibility = 'hidden'
  } else {
    mouseLight.value.style.visibility = 'visible'
  }
}

onBeforeMount(() => (observer.value = new IntersectionObserver(observerCallback)))

onMounted(() => observer.value.observe(root.value))

onBeforeUnmount(() => {
  ctaContainer.value.removeEventListener('mousemove', (e) => { mouseMoveLight(e) })
  observer.value?.disconnect()
})
</script>
