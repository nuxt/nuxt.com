export const useCounterAnimations = () => {
  const currentSection = ref(0)
  const currentStep = ref(null)

  const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  const startCounter = async (ms?: (Array<number> | number), counter?: number) => {
    if (typeof (ms) === 'number') {
      currentSection.value = counter
    } else {
      for (let i = 0; i < ms.length; i++) {
        currentSection.value = i

        await sleep(ms[i])

        if (i === ms.length - 1) {
          i = -1
        }
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

  const startSection = (counter: number) => {
    currentSection.value = counter
  }

  return {
    startCounter,
    startStepper,
    currentSection,
    currentStep,
    startSection
  }
}
