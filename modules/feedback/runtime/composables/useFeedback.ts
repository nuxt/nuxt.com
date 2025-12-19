import type { Ref } from 'vue'
import type { FeedbackRating, FeedbackItem, FeedbackSubmission, PageAnalytic } from '../../types'
import { FEEDBACK_OPTIONS } from '../../types'

export function useFeedbackRatings() {
  const ratingConfig = computed(() => {
    return FEEDBACK_OPTIONS.reduce((acc, option) => {
      acc[option.value] = option
      return acc
    }, {} as Record<FeedbackRating, typeof FEEDBACK_OPTIONS[0]>)
  })

  function getScoreColor(score: number): string {
    if (score >= 4.0) return 'text-success'
    if (score >= 3.0) return 'text-warning'
    return 'text-error'
  }

  function getRatingFromFeedback(feedback: { rating: FeedbackRating }) {
    return ratingConfig.value[feedback.rating]
  }

  function calculateStats(feedbacks: { rating: FeedbackRating }[]) {
    const total = feedbacks.length
    const positive = feedbacks.filter(f => ['very-helpful', 'helpful'].includes(f.rating)).length
    const negative = feedbacks.filter(f => ['not-helpful', 'confusing'].includes(f.rating)).length

    const totalScore = feedbacks.reduce((sum, item) => sum + ratingConfig.value[item.rating].score, 0)
    const averageScore = total > 0 ? Number((totalScore / total).toFixed(1)) : 0
    const positivePercentage = total > 0 ? Math.round((positive / total) * 100) : 0

    return {
      total,
      positive,
      negative,
      averageScore,
      positivePercentage
    }
  }

  return {
    ratingConfig,
    getScoreColor,
    getRatingFromFeedback,
    calculateStats
  }
}

export function useFeedbackData(rawFeedback: Ref<Record<string, unknown>[] | null>) {
  const { calculateStats } = useFeedbackRatings()
  const { filterFeedbackByDateRange } = useDateRange()

  const allFeedbackData = computed<FeedbackItem[]>(() =>
    rawFeedback.value?.map(item => ({
      ...item,
      createdAt: new Date(item.createdAt as string),
      updatedAt: new Date(item.updatedAt as string)
    }) as FeedbackItem) || []
  )

  const feedbackData = computed(() =>
    filterFeedbackByDateRange(allFeedbackData.value)
  )

  const globalStats = computed(() => calculateStats(feedbackData.value))

  const pageAnalytics = computed((): PageAnalytic[] => {
    const filteredFeedback = filterFeedbackByDateRange(allFeedbackData.value)

    const pageGroups: Record<string, FeedbackItem[]> = filteredFeedback.reduce((acc, item) => {
      if (!acc[item.path]) {
        acc[item.path] = []
      }
      acc[item.path].push(item)
      return acc
    }, {} as Record<string, FeedbackItem[]>)

    return Object.entries(pageGroups).map(([path, feedback]) => {
      const stats = calculateStats(feedback)
      const sortedFeedback = feedback.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      const oldestFeedback = feedback.reduce((oldest, current) =>
        new Date(current.createdAt) < new Date(oldest.createdAt) ? current : oldest
      )

      return {
        path,
        ...stats,
        feedback,
        lastFeedback: sortedFeedback[0],
        createdAt: new Date(oldestFeedback.createdAt),
        updatedAt: new Date(sortedFeedback[0].updatedAt)
      }
    }).sort((a, b) => b.total - a.total)
  })

  return {
    feedbackData,
    globalStats,
    pageAnalytics
  }
}

export function useFeedbackModal() {
  const selectedPage = ref<PageAnalytic | null>(null)
  const showFeedbackModal = ref(false)
  const currentPage = ref(1)
  const itemsPerPage = 5

  const paginatedFeedback = computed(() => {
    if (!selectedPage.value) return []

    const sortedFeedback = [...selectedPage.value.feedback].sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )

    const startIndex = (currentPage.value - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage

    return sortedFeedback.slice(startIndex, endIndex)
  })

  const totalPages = computed(() => {
    if (!selectedPage.value) return 0
    return Math.ceil(selectedPage.value.feedback.length / itemsPerPage)
  })

  function viewPageDetails(page: PageAnalytic) {
    selectedPage.value = page
    currentPage.value = 1
    showFeedbackModal.value = true
  }

  function closeFeedbackModal() {
    showFeedbackModal.value = false
    selectedPage.value = null
  }

  return {
    selectedPage: readonly(selectedPage),
    showFeedbackModal,
    currentPage,
    itemsPerPage,
    paginatedFeedback,
    totalPages,
    viewPageDetails,
    closeFeedbackModal
  }
}

export function useFeedbackDelete() {
  const toast = useToast()

  async function deleteFeedback(id: number): Promise<boolean> {
    try {
      await $fetch(`/api/_feedback/${id}`, {
        method: 'DELETE'
      })

      toast.add({
        title: 'Feedback deleted',
        description: 'The feedback has been successfully removed',
        color: 'success',
        icon: 'i-lucide-check'
      })

      return true
    } catch (error) {
      console.error('Failed to delete feedback:', error)
      toast.add({
        title: 'Failed to delete feedback',
        description: 'Please try again later',
        color: 'error',
        icon: 'i-lucide-circle-alert'
      })

      return false
    }
  }

  return {
    deleteFeedback
  }
}

interface UseFeedbackFormOptions {
  page: {
    title: string
    stem: string
  }
}

export function useFeedbackForm(options: UseFeedbackFormOptions) {
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
      feedback: formState.feedback.trim() || undefined,
      path: route.path,
      title: options.page.title,
      stem: options.page.stem
    }

    try {
      await $fetch('/api/_feedback', {
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
    formState,
    isExpanded: readonly(isExpanded),
    isSubmitted: readonly(isSubmitted),
    isSubmitting: readonly(isSubmitting),
    handleRatingSelect,
    submitFeedback,
    resetFeedback
  }
}
