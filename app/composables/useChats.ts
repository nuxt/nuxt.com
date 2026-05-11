import { isToday, isYesterday, subMonths } from 'date-fns'

export interface UIChat {
  id: string
  label: string
  icon?: string
  to?: string
  createdAt: string | Date
}

export function useChats(chats: Ref<UIChat[] | undefined | null>) {
  const groups = computed(() => {
    const today: UIChat[] = []
    const yesterday: UIChat[] = []
    const lastWeek: UIChat[] = []
    const lastMonth: UIChat[] = []
    const older: Record<string, UIChat[]> = {}

    const oneWeekAgo = subMonths(new Date(), 0.25)
    const oneMonthAgo = subMonths(new Date(), 1)

    chats.value?.forEach((chat) => {
      const chatDate = new Date(chat.createdAt)

      if (isToday(chatDate)) today.push(chat)
      else if (isYesterday(chatDate)) yesterday.push(chat)
      else if (chatDate >= oneWeekAgo) lastWeek.push(chat)
      else if (chatDate >= oneMonthAgo) lastMonth.push(chat)
      else {
        const monthYear = chatDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        if (!older[monthYear]) older[monthYear] = []
        older[monthYear].push(chat)
      }
    })

    const sortedMonthYears = Object.keys(older).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    const formattedGroups: Array<{ id: string, label: string, items: UIChat[] }> = []
    if (today.length) formattedGroups.push({ id: 'today', label: 'Today', items: today })
    if (yesterday.length) formattedGroups.push({ id: 'yesterday', label: 'Yesterday', items: yesterday })
    if (lastWeek.length) formattedGroups.push({ id: 'last-week', label: 'Last week', items: lastWeek })
    if (lastMonth.length) formattedGroups.push({ id: 'last-month', label: 'Last month', items: lastMonth })

    sortedMonthYears.forEach((monthYear) => {
      if (older[monthYear]?.length) {
        formattedGroups.push({ id: monthYear, label: monthYear, items: older[monthYear] })
      }
    })

    return formattedGroups
  })

  return { groups }
}
