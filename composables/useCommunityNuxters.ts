export const useCommunityNuxters = () => {
  const _nuxters = useState('community-nuxters', () => [])
  const route = useRoute()

  const pending = ref(false)

  // Http
  async function fetch ({ force = false } = {}) {
    if (_nuxters.value.length && !force) {
      return
    }

    pending.value = true

    const date = new Date()
    switch (selectedTime.value?.key) {
      case 'day':
        date.setDate(date.getDate() - 1)
        break
      case 'week':
        date.setDate(date.getDate() - 7)
        break
      case 'month':
        date.setMonth(date.getMonth() - 1)
        break
    }
    const time = date.toISOString().split('T', 1)[0]

    try {
      const data = await $fetch('/api/community/nuxters', {
        params: {
          time
        }
      })

      _nuxters.value = data
    } catch (e) {
      _nuxters.value = []
    }

    pending.value = false
  }

  // Data
  const times = [
    { key: 'day', label: 'Last day' },
    { key: 'week', label: 'Last week' },
    { key: 'month', label: 'Last month' }
  ]
  const sorts = [
    { key: 'activities', label: 'Activities' },
    { key: 'issues', label: 'Issues' },
    { key: 'pull_requests', label: 'Pull Requests' },
    { key: 'comments', label: 'Comments' }
  ]

  // Computed
  const nuxters = computed(() => {
    // TODO: filter
    return _nuxters.value
      .sort((a, b) => b[selectedSort.value.key] - a[selectedSort.value.key])
      .map((nuxter, index) => ({ ...nuxter, rank: index + 1 }))
  })

  const selectedTime = computed(() => {
    return times.find(time => time.key === route.query.time) || times[0]
  })

  const selectedSort = computed(() => {
    return sorts.find(sort => sort.key === route.query.sortBy) || sorts[0]
  })

  const q = computed(() => {
    return route.query.q
  })

  return {
    // Http
    fetch,
    pending,
    // Data
    times,
    sorts,
    // Computed
    nuxters,
    selectedTime,
    selectedSort,
    q
  }
}
