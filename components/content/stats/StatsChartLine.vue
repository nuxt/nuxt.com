<template>
  <div>
    <Line
      :chart-data="data"
      :chart-options="options"
    />
  </div>
</template>

<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
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
  LineElement,
  LinearScale,
  PointElement,
  CategoryScale
)

const data = computed(() => ({
  ...props.data,
  datasets: props.data.datasets.map(dataset => ({
    fill: true,
    pointRadius: 0,
    backgroundColor: '#83ffcc',
    borderColor: '#00dc82',
    tension: 0,
    ...dataset
  }))
}))

const options = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      grid: {
        display: false
      }
    },
    y: {
      ticks: {
        beginAtZero: false
      }
    }
  },
  ...props.options
}))
</script>
