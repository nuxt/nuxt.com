interface UseFeedbackOptions {
  page: {
    title: string
    stem: string
  }
}

export function useFeedback(options: UseFeedbackOptions) {
  const route = useRoute()
  const toast = useToast()

  const formState = reactive({
    rating: null as FeedbackRating | null,
    feedback: ''
  })

  const isExpanded = ref(false)
  const isSubmitted = ref(false)
  const isSubmitting = ref(false)

  function cancelFeedback() {
    formState.rating = null
    formState.feedback = ''
    isExpanded.value = false
  }

  function handleRatingSelect(rating: FeedbackRating) {
    if (isSubmitted.value) return

    if (isExpanded.value && rating === formState.rating) {
      cancelFeedback()
      return
    }

    formState.rating = rating
    isExpanded.value = true
  }

  async function submitFeedback() {
    if (!formState.rating) return

    isSubmitting.value = true

    const submission: FeedbackSubmission = {
      rating: formState.rating,
      feedback: formState.feedback || undefined,
      path: route.path,
      title: options.page.title,
      stem: options.page.stem
    }

    try {
      await $fetch('/api/feedback', {
        method: 'POST',
        body: submission
      })

      await new Promise(resolve => setTimeout(resolve, 1000))
      isSubmitted.value = true
    } catch {
      toast.add({
        title: 'Failed to submit feedback',
        description: 'Please try again later',
        color: 'error',
        icon: 'i-lucide-circle-alert'
      })
    } finally {
      isSubmitting.value = false
    }
  }

  function resetFeedback() {
    isSubmitted.value = false
    isExpanded.value = false
    formState.rating = null
    formState.feedback = ''
  }

  watch(route, resetFeedback)

  return {
    formState: readonly(formState),
    isExpanded: readonly(isExpanded),
    isSubmitted: readonly(isSubmitted),
    isSubmitting: readonly(isSubmitting),
    handleRatingSelect,
    submitFeedback,
    resetFeedback
  }
}
