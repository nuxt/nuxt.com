<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { h, resolveComponent } from 'vue'
import { l10nPagesStatusPath, localisePath, type L10nLocale, type L10nPageStatus } from '#shared/utils/l10n'

const props = defineProps<{ locale: L10nLocale }>()

const ULink = resolveComponent('ULink')

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
const numeric = { th: 'text-right', td: 'text-right tabular-nums' }

const columns: TableColumn<L10nPageStatus>[] = [
  {
    accessorKey: 'path',
    header: 'Page',
    cell: ({ row }) => h(ULink, { to: localisePath(props.locale, row.original.path), external: true, class: 'text-highlighted hover:underline' }, () => row.original.path)
  },
  { accessorKey: 'words', header: 'Words', meta: { class: numeric } },
  { accessorKey: 'reviewed', header: 'Reviewed', cell: ({ row }) => percent(row.original.reviewed), meta: { class: numeric } },
  {
    id: 'machine',
    header: 'Machine',
    cell: ({ row }) => row.original.words ? percent((row.original.byStatus.machine ?? 0) / row.original.words) : '',
    meta: { class: numeric }
  },
  { accessorKey: 'pending', header: 'Pending', meta: { class: numeric } },
  { accessorKey: 'indexable', header: 'Indexed', cell: ({ row }) => row.original.indexable ? 'Yes' : 'No' }
]
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-end gap-2">
      <UFormField label="Filter pages" class="w-full md:w-80">
        <UInput v-model="query" icon="i-lucide-search" type="search" class="w-full" />
      </UFormField>
      <UFormField label="Sort" class="w-48">
        <USelect
          v-model="sort"
          :items="[{ label: 'Most pending first', value: 'pending' }, { label: 'Most reviewed first', value: 'reviewed' }, { label: 'By path', value: 'path' }]"
          class="w-full"
        />
      </UFormField>
      <p class="ms-auto text-sm text-muted" role="status">
        <template v-if="status === 'success'">
          {{ filtered.length }} of {{ pages.length }} pages
        </template>
      </p>
    </div>

    <UTable
      :data="visible"
      :columns="columns"
      :loading="status === 'pending' || status === 'idle'"
      :empty="status === 'error' ? 'Could not load the pages.' : 'No pages match this filter.'"
      caption="Review state of each translated page"
      :ui="{ caption: 'sr-only', td: 'py-1.5' }"
    />

    <UPagination v-if="filtered.length > PAGE_SIZE" v-model:page="page" :total="filtered.length" :items-per-page="PAGE_SIZE" />
  </div>
</template>
