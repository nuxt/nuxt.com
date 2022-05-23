export const useCounterAnimations = () => {
  const currentSection = ref(0)
  const currentStep = ref(null)
  const counterTimeoutId = ref()

  const startCounter = async (ms: Array<number>) => {
    for (currentSection.value; currentSection.value <= ms.length; currentSection.value++) {
      await new Promise((resolve) => {
        counterTimeoutId.value = setTimeout(resolve, ms[currentSection.value])
      })

      if (currentSection.value === ms.length) {
        currentSection.value = -1
      }
    }
  }

  const restartCounter = (ms: Array<number>, sectionNumber: number) => {
    stopCounter()
    currentSection.value = sectionNumber
    currentStep.value = null

    setTimeout(() => {
      startCounter(ms)
    }, 300)
  }

  const stopCounter = () => {
    clearTimeout(counterTimeoutId.value)
  }

  const startStepper = async (ms?: Array<number>) => {
    for (let i = 0; i < ms.length; i++) {
      currentStep.value = i

      await new Promise((resolve) => {
        setTimeout(resolve, ms[currentStep.value])
      })
    }
    currentStep.value = null
  }

  return {
    startCounter,
    startStepper,
    currentSection,
    currentStep,
    restartCounter,
    stopCounter
  }
}
