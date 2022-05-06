<template>
  <div>
    <div class="absolute -right-[50px] top-4 transition-colors duration-300" :class="[1, 2, 8, 9].includes(currentSection) ? 'u-text-gray-600' : 'u-text-gray-900'">
      <svg width="308" height="126" viewBox="0 0 308 126" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="308" height="126" rx="12" fill="currentColor" />
        <path d="M20.508 27V18.278H23.63V17.2H16.168V18.278H19.304V27H20.508ZM28.5845 24.732C28.3605 25.614 27.6325 26.118 26.4845 26.118C25.1545 26.118 24.1885 25.082 24.1045 23.626H29.6205C29.6345 23.528 29.6485 23.29 29.6485 23.136C29.6485 21.26 28.4165 19.832 26.3585 19.832C24.2865 19.832 22.9985 21.358 22.9985 23.43C22.9985 25.446 24.3985 27.112 26.4845 27.112C28.2345 27.112 29.4805 26.174 29.7185 24.732H28.5845ZM26.3585 20.784C27.6185 20.784 28.4165 21.54 28.5005 22.73H24.1605C24.3705 21.484 25.1685 20.784 26.3585 20.784ZM35.0904 19.944H34.1944C33.1584 19.944 32.5704 20.406 32.2764 21.372V19.944H31.1564V27H32.2764V23.892C32.2764 22.226 32.6824 20.938 34.1104 20.938H35.0904V19.944ZM37.4034 27V22.856C37.4034 21.652 38.1034 20.826 39.2934 20.826C40.2734 20.826 40.8754 21.652 40.8754 22.856V27H41.9954V22.856C41.9954 21.652 42.6954 20.826 43.8714 20.826C44.8654 20.826 45.4674 21.652 45.4674 22.856V27H46.5874V22.562C46.5874 20.854 45.6634 19.832 44.1374 19.832C43.0594 19.832 42.1214 20.49 41.8554 21.33C41.6034 20.364 40.6934 19.832 39.5314 19.832C38.4534 19.832 37.6694 20.448 37.4034 21.302V19.944H36.2834V27H37.4034ZM48.3537 18.614H49.6417V17.046H48.3537V18.614ZM49.5577 27V19.944H48.4377V27H49.5577ZM52.5245 27V23.192C52.5245 21.82 53.3925 20.854 54.5965 20.854C55.6605 20.854 56.3605 21.666 56.3605 22.87V27H57.4805V22.688C57.4805 20.966 56.4445 19.832 54.8485 19.832C53.7705 19.832 52.8885 20.322 52.5245 21.302V19.944H51.4045V27H52.5245ZM61.9548 19.832C60.3728 19.832 59.0848 20.84 58.9588 22.198H60.0228C60.0788 21.428 60.8908 20.784 61.9268 20.784C63.1308 20.784 63.8168 21.442 63.8168 22.408C63.8168 22.632 63.6768 22.786 63.3688 22.786H61.7728C60.0648 22.786 58.9588 23.64 58.9588 24.984C58.9588 26.272 59.9248 27.112 61.4088 27.112C62.5008 27.112 63.4388 26.594 63.8168 25.782V27H64.9368V22.45C64.9368 20.882 63.7888 19.832 61.9548 19.832ZM61.5768 26.16C60.6808 26.16 60.1068 25.698 60.1068 24.97C60.1068 24.144 60.7928 23.64 61.8428 23.64H63.8168V23.822C63.8168 25.278 62.9908 26.16 61.5768 26.16ZM67.7699 27V17.046H66.6499V27H67.7699Z" fill="#E2E8F0" />
      </svg>

      <span class="absolute top-[38%] left-4 text-green-400 font-mono transition-opacity duration-300" :class="[4, 5, 11, 12].includes(currentSection) ? 'opacity-0' : 'opacity-100'">
        Compiled successfully
      </span>

      <span class="absolute top-[38%] left-4 text-green-400 font-mono transition-opacity duration-300" :class="[4, 11].includes(currentSection) ? 'opacity-100' : 'opacity-0'">
        Compilation 0%
      </span>

      <span class="absolute top-[38%] left-4 text-green-400 font-mono transition-opacity duration-300" :class="[5, 12].includes(currentSection) ? 'opacity-100' : 'opacity-0'">
        Compilation 100%
      </span>

      <span class="absolute top-[60%] left-4 u-text-gray-500 tracking-wide font-mono transition-opacity duration-300" :class="[4, 5, 11, 12].includes(currentSection) ? 'opacity-100' : 'opacity-0'">
        ...
      </span>
      <span class="absolute top-[60%] left-4 absolute u-text-gray-500 tracking-wide font-mono transition-opacity duration-300" :class="[4, 5, 11, 12].includes(currentSection) ? 'opacity-0' : 'opacity-100'">
        Waiting to compile ...
      </span>
    </div>
    <img
      src="/docs/framework/v3/auto-import/terminal.svg"
      class="absolute -right-[50px] top-4 w-[308px] h-[126px] transition-opacity duration-300"
      :class="[1, 2, 8, 9].includes(currentSection) ? 'opacity-80' : 'opacity-0'"
    >
  </div>
</template>

<script setup lang="ts">

const { startCounter, currentSection, startUniqueCounter, startUniqueAnimation } = useCounterAnimations()
const animationsDelay = [1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 4000]

const props = defineProps({
  currentSection: {
    type: Number,
    default: 0
  },
  uniqueAnimation: {
    type: Boolean,
    default: false
  }
})

onMounted(() => startCounter(animationsDelay))

watch([() => props.currentSection, () => props.uniqueAnimation], ([currentSection, uniqueAnimation]) => {
  console.log('uniqueAnimation')
  if (uniqueAnimation) {
    const startSection = ref(0)
    const endSection = ref(0)

    startSection.value = currentSection === 0 ? 0 : currentSection === 1 ? 7 : 14
    endSection.value = currentSection === 0 ? 6 : currentSection === 1 ? 13 : 14

    startUniqueCounter(animationsDelay, startSection.value, endSection.value)
  }
})

</script>
