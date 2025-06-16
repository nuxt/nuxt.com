<script setup lang="ts">
import { DateFormatter, getLocalTimeZone, CalendarDate, today } from '@internationalized/date'

const { dateRange, setDateRange, setPresetRange } = useDateRange()

const df = new DateFormatter('en-US', {
  dateStyle: 'medium'
})

const ranges = [
  { label: 'Last 7 days', preset: 'week' as const },
  { label: 'Last 30 days', preset: 'month' as const },
  { label: 'Last 3 months', preset: '3months' as const },
  { label: 'Last 6 months', preset: '6months' as const },
  { label: 'Last year', preset: 'year' as const }
]

const toCalendarDate = (date: Date) => {
  return new CalendarDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  )
}

const calendarRange = computed({
  get: () => ({
    start: dateRange.value.start ? toCalendarDate(dateRange.value.start) : undefined,
    end: dateRange.value.end ? toCalendarDate(dateRange.value.end) : undefined
  }),
  set: (newValue: { start: CalendarDate | null, end: CalendarDate | null }) => {
    if (newValue.start && newValue.end) {
      setDateRange({
        start: newValue.start.toDate(getLocalTimeZone()),
        end: newValue.end.toDate(getLocalTimeZone())
      })
    }
  }
})

const isRangeSelected = (preset: 'week' | 'month' | '3months' | '6months' | 'year') => {
  if (!dateRange.value.start || !dateRange.value.end) return false

  const currentDate = today(getLocalTimeZone())
  let startDate = currentDate.copy()

  switch (preset) {
    case 'week':
      startDate = startDate.subtract({ days: 7 })
      break
    case 'month':
      startDate = startDate.subtract({ days: 30 })
      break
    case '3months':
      startDate = startDate.subtract({ months: 3 })
      break
    case '6months':
      startDate = startDate.subtract({ months: 6 })
      break
    case 'year':
      startDate = startDate.subtract({ years: 1 })
      break
  }

  const selectedStart = toCalendarDate(dateRange.value.start)
  const selectedEnd = toCalendarDate(dateRange.value.end)

  return Math.abs(selectedStart.toDate(getLocalTimeZone()).getTime() - startDate.toDate(getLocalTimeZone()).getTime()) < 24 * 60 * 60 * 1000
    && Math.abs(selectedEnd.toDate(getLocalTimeZone()).getTime() - currentDate.toDate(getLocalTimeZone()).getTime()) < 24 * 60 * 60 * 1000
}
</script>

<template>
  <div class="flex items-center justify-center w-full mb-4">
    <UPopover :content="{ align: 'center' }" :modal="true">
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide-calendar"
        class="data-[state=open]:bg-elevated group min-w-[280px]"
      >
        <span class="truncate">
          <template v-if="dateRange.start && dateRange.end">
            {{ df.format(dateRange.start) }} - {{ df.format(dateRange.end) }}
          </template>
          <template v-else>
            Pick a date range
          </template>
        </span>

        <template #trailing>
          <UIcon name="i-lucide-chevron-down" class="shrink-0 text-dimmed size-5 group-data-[state=open]:rotate-180 transition-transform duration-200" />
        </template>
      </UButton>

      <template #content>
        <div class="flex items-stretch sm:divide-x divide-default">
          <div class="hidden sm:flex flex-col justify-center min-w-[140px]">
            <UButton
              v-for="(range, index) in ranges"
              :key="index"
              :label="range.label"
              color="neutral"
              variant="ghost"
              class="rounded-none px-4 justify-start"
              :class="[isRangeSelected(range.preset) ? 'bg-elevated' : 'hover:bg-elevated/50']"
              truncate
              @click="setPresetRange(range.preset)"
            />
          </div>

          <UCalendar
            v-model="calendarRange"
            class="p-2"
            :number-of-months="2"
            range
          />
        </div>
      </template>
    </UPopover>
  </div>
</template>
