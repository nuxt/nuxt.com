const HOVER_DELAY = 150
const HOVER_COOLDOWN = 1500
const CLICK_COOLDOWN = 350

// Nuxt's first commit landed on October 26, 2016, and the copy says "10 years",
// so only October 26, 2026 counts. The date is only ever checked in the browser:
// pages are cached (ISR), so the server can't know the day. Keep both checks in sync.
function isBirthdayToday() {
  const now = new Date()
  return now.getFullYear() === 2026 && now.getMonth() === 9 && now.getDate() === 26
}
const BIRTHDAY_HEAD_SCRIPT = `(function(){var d=new Date();if(d.getFullYear()===2026&&d.getMonth()===9&&d.getDate()===26)document.documentElement.setAttribute('data-nuxt-birthday','')})()`

let lastBurst = 0

export function useNuxtBirthday() {
  const isBirthday = useState('nuxt-birthday', () => false)

  // Flags <html> before first paint so CSS can swap server-rendered content
  // without a flash or a hydration mismatch
  useHead({
    script: [{
      key: 'nuxt-birthday',
      tagPosition: 'head',
      innerHTML: BIRTHDAY_HEAD_SCRIPT
    }]
  })

  // Re-check at midnight and when a suspended tab comes back, so a page left
  // open across the day boundary doesn't keep the wrong state
  let midnightTimer: ReturnType<typeof setTimeout> | undefined

  function syncBirthday() {
    isBirthday.value = isBirthdayToday()
    document.documentElement.toggleAttribute('data-nuxt-birthday', isBirthday.value)

    clearTimeout(midnightTimer)
    const nextMidnight = new Date()
    nextMidnight.setHours(24, 0, 0, 0)
    midnightTimer = setTimeout(syncBirthday, nextMidnight.getTime() - Date.now())
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'visible') syncBirthday()
  }

  onMounted(() => {
    syncBirthday()
    document.addEventListener('visibilitychange', onVisibilityChange)
  })

  onBeforeUnmount(() => {
    clearTimeout(midnightTimer)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })

  function celebrate(container?: EventTarget | null, cooldown = CLICK_COOLDOWN) {
    const origin = container instanceof Element ? container.querySelector('[data-confetti-origin]') : null
    if (!isBirthday.value || !origin || Date.now() - lastBurst < cooldown) return
    lastBurst = Date.now()

    const rect = origin.getBoundingClientRect()
    burstConfetti({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 3 })
  }

  // Only celebrate when the pointer rests on the element, so sweeping across
  // the page doesn't set it off
  let hoverTimer: ReturnType<typeof setTimeout> | undefined

  function startHoverCelebrate(container?: EventTarget | null) {
    clearTimeout(hoverTimer)
    hoverTimer = setTimeout(() => celebrate(container, HOVER_COOLDOWN), HOVER_DELAY)
  }

  function cancelHoverCelebrate() {
    clearTimeout(hoverTimer)
  }

  onBeforeUnmount(cancelHoverCelebrate)

  return { isBirthday, celebrate, startHoverCelebrate, cancelHoverCelebrate }
}
