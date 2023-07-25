<script setup lang="ts">
const props = defineProps({
  throttle: {
    type: Number,
    default: 200
  },
  duration: {
    type: Number,
    default: 2000
  },
  height: {
    type: Number,
    default: 3
  }
})
// Options & Data
const data = reactive({
  percent: 0,
  show: false,
  canSucceed: true,
  left: 0
})
// Local variables
let _timer: any = null
let _throttle: any = null
let _cut: number

// Functions
const clear = () => {
  _timer && clearInterval(_timer)
  _throttle && clearTimeout(_throttle)
  _timer = null
}
const start = () => {
  clear()
  data.percent = 0
  data.canSucceed = true

  if (props.throttle) {
    _throttle = setTimeout(startTimer, props.throttle)
  } else {
    startTimer()
  }
}
// const set = (num) => {
//   data.show = true
//   data.canSucceed = true
//   data.percent = Math.min(100, Math.max(0, Math.floor(num)))
// }
const increase = (num: number) => {
  data.percent = Math.min(100, Math.floor(data.percent + num))
}
// const decrease = (num) => {
//   data.percent = Math.max(0, Math.floor(data.percent - num))
// }
// const pause = () => clearInterval(_timer)
// const resume = () => startTimer()
const finish = () => {
  data.percent = 100
  hide()
}
const hide = () => {
  clear()
  setTimeout(() => {
    data.show = false
    setTimeout(() => {
      data.percent = 0
    }, 400)
  }, 500)
}
// const fail = (error) => {
//   data.canSucceed = false
// }
const startTimer = () => {
  data.show = true
  _cut = 10000 / Math.floor(props.duration)
  _timer = setInterval(() => {
    increase(_cut)
  }, 100)
}

// Hooks
const nuxtApp = useNuxtApp()

nuxtApp.hook('page:start', start)
nuxtApp.hook('page:finish', finish)

onBeforeUnmount(() => clear)
</script>

<template>
  <div
    class="nuxt-progress"
    :class="{
      'nuxt-progress-failed': !data.canSucceed,
    }"
    :style="{
      width: data.percent + '%',
      left: data.left,
      height: props.height + 'px',
      opacity: data.show ? 1 : 0,
      backgroundSize: (100 / data.percent) * 100 + '% auto',
    }"
  />
</template>

<style>
.nuxt-progress {
  position: fixed;
  top: 0px;
  left: 0px;
  right: 0px;
  width: 0%;
  opacity: 1;
  transition: width 0.1s, height 0.4s, opacity 0.4s;
  background: repeating-linear-gradient(
    to right,
    #00dc82 0%,
    #34cdfe 50%,
    #0047e1 100%
  );
  z-index: 999999;
}

.nuxt-progress.nuxt-progress-notransition {
  transition: none;
}

.nuxt-progress-failed {
  background-color: red;
}
</style>
