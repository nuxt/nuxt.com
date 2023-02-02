<template>
  <ClientOnly>
    <Bar :data="chartData" :options="chartOptions" />
  </ClientOnly>
</template>

<script lang="ts">
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const chart = {
  labels: [
    '[vercel] Basic',
    '[netlify] Basic',
    '[netlify] strapi.nuxtjs.org',
    '[netlify] content.nuxtjs.org',
    '[netlify] nuxtjs.org'
  ],
  datasets: [
    {
      label: 'Build',
      backgroundColor: '#2d3748',
      data: [9, 16.4, 34.3, 41, 114]
    },
    {
      label: 'Cache',
      backgroundColor: '#108775',
      data: [3, 5.6, 7.2, 13, 25]
    }
  ]
}

const options = {
  responsive: true,
  maintainAspectRatio: false
}

export default {
  components: { Bar },
  data () {
    return {
      chartData: chart,
      chartOptions: options
    }
  }
}
</script>
