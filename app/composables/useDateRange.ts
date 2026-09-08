import { subDays, subMonths, subYears, startOfDay, endOfDay } from 'date-fns'

export interface DateRange {
  start: Date
  end: Date
}

export function useDateRange() {
  const dateRange = useState<DateRange>('feedback-date-range', () => ({
    start: subDays(new Date(), 30),
    end: new Date()
  }))

  const setDateRange = (range: DateRange) => {
    dateRange.value = {
      start: startOfDay(range.start),
      end: endOfDay(range.end)
    }
  }

  const setPresetRange = (preset: 'week' | 'month' | '3months' | '6months' | 'year') => {
    const end = new Date()
    let start: Date

    switch (preset) {
      case 'week':
        start = subDays(end, 7)
        break
      case 'month':
        start = subDays(end, 30)
        break
      case '3months':
        start = subMonths(end, 3)
        break
      case '6months':
        start = subMonths(end, 6)
        break
      case 'year':
        start = subYears(end, 1)
        break
      default:
        start = subDays(end, 30)
    }

    setDateRange({ start, end })
  }

  const isDateInRange = (date: Date | string) => {
    const checkDate = typeof date === 'string' ? new Date(date) : date
    return checkDate >= dateRange.value.start && checkDate <= dateRange.value.end
  }

  const filterFeedbackByDateRange = <T extends { createdAt: Date | string }>(feedback: T[]): T[] => {
    return feedback.filter(item => isDateInRange(item.createdAt))
  }

  return {
    dateRange: readonly(dateRange),
    setDateRange,
    setPresetRange,
    isDateInRange,
    filterFeedbackByDateRange
  }
}
