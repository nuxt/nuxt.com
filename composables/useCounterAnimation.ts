export const useCounterAnimations = () => {
  const currentSection = ref(0)
  const currentStep = ref(null)
  const counterStopped = ref(false)
  const uniqueAnimationRunning = ref(false)

  const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  const startCounter = async (ms: Array<number>) => {
    for (let i = 0; i < ms.length; i++) {
      currentSection.value = i

      if (counterStopped.value) {
        i = ms.length
        currentStep.value = null
      } else {
        await sleep(ms[i])
        if (i === ms.length - 1) {
          i = -1
        }
      }
    }
  }

  const startUniqueCounter = async (ms: Array<number>, startSection: number, endSection: number) => {
    counterStopped.value = true
    uniqueAnimationRunning.value = true

    for (let i = startSection; i <= endSection; i++) {
      currentSection.value = i

      await sleep(ms[i])

      if (i === endSection) {
        uniqueAnimationRunning.value = false
      }
    }
  }

  const startStepper = async (ms?: Array<number>) => {
    for (let i = 0; i < ms.length; i++) {
      currentStep.value = i

      await sleep(ms[i])
    }
    currentStep.value = null
  }

  return {
    startCounter,
    startStepper,
    currentSection,
    currentStep,
    uniqueAnimationRunning,
    counterStopped,
    startUniqueCounter
  }
}
