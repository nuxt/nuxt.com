<script lang="ts" setup>
import type { NuxterProfile } from '#shared/types'

// Only the username is in the image URL: the stats are read at render time,
// so a README card stays the same URL and shows fresh numbers.
const props = defineProps<{
  username: string
}>()

const nuxter = await $fetch<NuxterProfile>(`/api/nuxters/${props.username}`)
const since = nuxter.firstContributionAt ? new Date(nuxter.firstContributionAt).getUTCFullYear() : null

const { format } = new Intl.NumberFormat('en-US')

// Two explicit rows: takumi does not wrap flex items.
const rows = [
  [
    { label: 'Merged PRs', value: nuxter.mergedPullRequests.all, color: '#00DC82' },
    { label: 'Issues', value: nuxter.issues, color: '#38BDF8' }
  ],
  [
    { label: 'Comments', value: nuxter.comments, color: '#A78BFA' },
    { label: 'Reactions', value: nuxter.reactions, color: '#FACC15' }
  ]
]
</script>

<template>
  <div class="size-full flex flex-row bg-neutral-950 text-white p-16 gap-16">
    <div class="flex flex-col w-[380px] items-center justify-between">
      <div class="flex flex-col items-center">
        <img
          :src="`https://avatars.githubusercontent.com/u/${nuxter.githubId}?s=256`"
          class="size-[176px] rounded-full"
          :style="{ border: '4px solid #262626' }"
          width="176"
          height="176"
        >
        <p class="text-5xl font-semibold mt-6">
          {{ nuxter.username }}
        </p>
        <p class="text-3xl text-neutral-400 mt-4">
          Nuxter #{{ format(nuxter.rank) }}
        </p>
        <p class="text-4xl font-semibold text-green-400 mt-4">
          {{ format(nuxter.score) }} pts
        </p>
        <p v-if="since" class="text-2xl text-neutral-500 mt-3">
          Nuxter since {{ since }}
        </p>
      </div>

      <svg
        viewBox="0 0 256 168"
        xmlns="http://www.w3.org/2000/svg"
        width="64"
        height="42"
        class="w-[64px] h-[42px] shrink-0"
        preserveAspectRatio="xMidYMid meet"
      >
        <path fill="#00DC82" d="M143.618 167.029h95.166c3.023 0 5.992-.771 8.61-2.237a16.963 16.963 0 0 0 6.302-6.115 16.324 16.324 0 0 0 2.304-8.352c0-2.932-.799-5.811-2.312-8.35L189.778 34.6a16.966 16.966 0 0 0-6.301-6.113 17.626 17.626 0 0 0-8.608-2.238c-3.023 0-5.991.772-8.609 2.238a16.964 16.964 0 0 0-6.3 6.113l-16.342 27.473-31.95-53.724a16.973 16.973 0 0 0-6.304-6.112A17.638 17.638 0 0 0 96.754 0c-3.022 0-5.992.772-8.61 2.237a16.973 16.973 0 0 0-6.303 6.112L2.31 141.975A16.302 16.302 0 0 0 0 150.325c0 2.932.793 5.813 2.304 8.352a16.964 16.964 0 0 0 6.302 6.115 17.628 17.628 0 0 0 8.61 2.237h59.737c23.669 0 41.123-10.084 53.134-29.758l29.159-48.983 15.618-26.215 46.874 78.742h-62.492l-15.628 26.214Zm-67.64-26.24-41.688-.01L96.782 35.796l31.181 52.492-20.877 35.084c-7.976 12.765-17.037 17.416-31.107 17.416Z" />
      </svg>
    </div>

    <div class="flex flex-col flex-1 gap-8 justify-center">
      <div v-for="(row, index) in rows" :key="index" class="flex flex-row gap-8">
        <div
          v-for="stat in row"
          :key="stat.label"
          class="flex flex-col justify-end flex-1 h-[220px] rounded-3xl bg-neutral-900 p-8"
          :style="{ border: `2px solid ${stat.color}` }"
        >
          <p class="text-6xl font-semibold">
            {{ format(stat.value) }}
          </p>
          <p class="text-3xl mt-2" :style="{ color: stat.color }">
            {{ stat.label }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
