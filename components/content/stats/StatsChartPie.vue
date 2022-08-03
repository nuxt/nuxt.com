<template>
  <div>
    <Pie
      :chart-data="data"
      :chart-options="options"
    />
  </div>
</template>

<script setup lang="ts">
import { Pie } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale
} from 'chart.js'

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  options: {
    type: Object,
    default: () => {}
  }
})

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale
)

const data = computed(() => ({
  ...props.data,
  datasets: props.data.datasets.map(dataset => ({
    offset: 0,
    hoverOffset: 0,
    backgroundColor: '#00dc82',
    borderColor: '#fff',
    ...dataset
  }))
}))

const options = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  ...props.options
}))
</script>
