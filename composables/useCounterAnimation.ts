import { sleep } from 'util'

export const useCounterAnimations = () => {
  const currentSection = ref(0)
  const currentStep = ref(0)

  const startCounter = (ms?: Array<number>) => {
    setTimeout(() => {
      currentSection.value < ms.length
        ? currentSection.value++
        : currentSection.value = 0
      startCounter(ms)
    }, ms[currentSection.value])
  }

  const startCounter2 = async (ms) => {
    for (let i = 0; i < ms.length; i++) {
      currentSection.value = i
      console.log('currentSection.value', currentSection.value)

      await sleep(ms[i])

      if (i === ms.length - 1) {
        i = -1
      }
    }
  }

  function sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  const startStepper = (ms?: Array<number>) => {
    currentStep.value < ms.length
      ? currentStep.value++
      : currentStep.value = 0

    setTimeout(() => {
      startStepper(ms)
    }, ms[currentStep.value])
  }

  return {
    startCounter,
    startStepper,
    currentSection,
    currentStep,
    startCounter2
  }
}
