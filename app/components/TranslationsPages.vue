<script setup lang="ts">
import { l10nPagesStatusPath, localisePath, type L10nLocale, type L10nPageStatus } from '#shared/utils/l10n'

const props = defineProps<{ locale: L10nLocale }>()

const PAGE_SIZE = 25

const { data: pages, status } = useLazyFetch<L10nPageStatus[]>(() => l10nPagesStatusPath(props.locale), { server: false, default: () => [] })

const query = ref('')
const sort = ref<'pending' | 'reviewed' | 'path'>('pending')
const page = ref(1)

const filtered = computed(() => {
  const needle = query.value.trim().toLowerCase()
  const list = needle ? pages.value.filter(item => item.path.toLowerCase().includes(needle)) : [...pages.value]
  if (sort.value === 'pending') list.sort((a, b) => b.pending - a.pending || a.path.localeCompare(b.path))
  if (sort.value === 'reviewed') list.sort((a, b) => b.reviewed - a.reviewed || a.path.localeCompare(b.path))
  return list
})
const visible = computed(() => filtered.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))

watch([query, sort], () => {
  page.value = 1
})

const percent = (value: number) => `${Math.round(value * 100)}%`
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap gap-2">
      <UInput v-model="query" icon="i-lucide-search" placeholder="Filter pages" class="w-full md:w-80" />
      <USelect
        v-model="sort"
        :items="[{ label: 'Most pending first', value: 'pending' }, { label: 'Most reviewed first', value: 'reviewed' }, { label: 'By path', value: 'path' }]"
        class="w-48"
      />
    </div>

    <p v-if="status !== 'success'" class="text-sm text-dimmed">
      {{ status === 'error' ? 'Could not load the pages.' : 'Loading pages…' }}
    </p>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="text-left text-xs text-muted">
          <tr>
            <th class="py-2 pe-4 font-medium">
              Page
            </th>
            <th class="py-2 pe-4 font-medium text-right">
              Words
            </th>
            <th class="py-2 pe-4 font-medium text-right">
              Reviewed
            </th>
            <th class="py-2 pe-4 font-medium text-right">
              Machine
            </th>
            <th class="py-2 pe-4 font-medium text-right">
              Pending
            </th>
            <th class="py-2 font-medium">
              Indexed
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in visible" :key="item.path" class="border-t border-default">
            <td class="py-1.5 pe-4">
              <a :href="localisePath(locale, item.path)" class="hover:underline">{{ item.path }}</a>
            </td>
            <td class="py-1.5 pe-4 text-right tabular-nums">
              {{ item.words }}
            </td>
            <td class="py-1.5 pe-4 text-right tabular-nums">
              {{ percent(item.reviewed) }}
            </td>
            <td class="py-1.5 pe-4 text-right tabular-nums">
              {{ item.words ? percent((item.byStatus.machine ?? 0) / item.words) : '' }}
            </td>
            <td class="py-1.5 pe-4 text-right tabular-nums">
              {{ item.pending || '' }}
            </td>
            <td class="py-1.5">
              <span v-if="item.indexable" class="text-success">Yes</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UPagination v-if="filtered.length > PAGE_SIZE" v-model:page="page" :total="filtered.length" :items-per-page="PAGE_SIZE" />
  </div>
</template>
