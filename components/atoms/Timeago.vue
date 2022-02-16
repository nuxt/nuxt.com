<template>
  <time :datetime="date" :title="date">{{ timeago }}</time>
</template>

<script setup lang="ts">
const props = defineProps({
  datetime: {
    type: [Date, String, Number],
    required: true
  },
  autoUpdate: {
    type: [Number, Boolean],
    default: 60
  },
  short: {
    type: Boolean,
    default: true
  },
  max: {
    type: String,
    default: null,
    validator (value) {
      return [null, 'minute', 'hour', 'day', 'week', 'month', 'year'].includes(value as string | undefined)
    }
  }
})

const units = [
  { max: 2760000, value: 60000, name: 'minute', short: 'm', past: 'a minute ago', future: 'in a minute' },
  { max: 72000000, value: 3600000, name: 'hour', short: 'h', past: 'an hour ago', future: 'in an hour' },
  { max: 518400000, value: 86400000, name: 'day', short: 'd', past: 'yesterday', future: 'tomorrow' },
  { max: 2419200000, value: 604800000, name: 'week', short: 'w', past: 'last week', future: 'in a week' },
  { max: 28512000000, value: 2592000000, name: 'month', short: 'mo', past: 'last month', future: 'in a month' },
  { max: Infinity, value: 31536000000, name: 'year', short: 'y', past: 'last year', future: 'in a year' }
]

let _updater
let updater

const getTimeago = () => {
  const diff = Date.now() - new Date(props.datetime).getTime()

  // less than a minute
  if (Math.abs(diff) < 60000) {
    return 'just now'
  }
  for (const unit of units) {
    if (Math.abs(diff) < unit.max || (props.max && unit.name === props.max)) {
      return format(diff, unit)
    }
  }
}
const format = (diff, unit) => {
  const val = Math.round(Math.abs(diff) / unit.value)
  if (diff < 0) {
    return val <= 1 ? unit.future : `in ${val}${props.short ? unit.short : ` ${unit.name}s`}`
  }
  return val <= 1 ? props.short ? `1${unit.short} ago` : unit.past : `${val}${props.short ? unit.short : ` ${unit.name}s`} ago`
}
const startUpdater = () => {
  if (props.autoUpdate) {
    const interval = (props.autoUpdate === true ? 60 : props.autoUpdate) * 1000
    _updater = setInterval(() => {
      timeago.value = getTimeago()
    }, interval)
  }
}
const stopUpdater = () => {
  if (_updater) {
    clearInterval(updater)
    updater = null
  }
}

const timeago = ref(getTimeago())

const date = computed(() => new Intl.DateTimeFormat(navigator.language, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  timeZoneName: 'short'
}).format(new Date(props.datetime)))

watch(() => props.datetime, () => {
  timeago.value = getTimeago()
})
watch(() => props.short, () => {
  timeago.value = getTimeago()
})
watch(() => props.max, () => {
  timeago.value = getTimeago()
})
watch(() => props.autoUpdate, (newValue) => {
  stopUpdater()
  if (newValue) {
    startUpdater()
  }
})

onMounted(() => {
  startUpdater()
})
onActivated(() => {
  startUpdater()
})
onDeactivated(() => {
  stopUpdater()
})
onBeforeUnmount(() => {
  stopUpdater()
})
</script>
