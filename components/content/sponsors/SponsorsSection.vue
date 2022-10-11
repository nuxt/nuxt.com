<script setup lang="ts">
const { data } = await useFetch('/api/sponsors')
</script>

<template>
  <section class="flex flex-col gap-y-12">
    <article v-for="(value, key) in data.sponsors" :key="key" class="flex flex-col items-center gap-y-12">
      <h2 class="text-3xl font-semibold u-text-gray-900 capitalize">
        {{ key }}
      </h2>
      <SponsorsSectionList :sponsors="data.sponsors[key]" :sponsor-type="key">
      <!-- <ul class="flex flex-wrap">
        <li v-for="{ sponsorEntity } in data.sponsors.platinum" :key="sponsorEntity.login">
          <a :href="`https://github.com/${sponsorEntity.login}`" :title="sponsorEntity.name" target="_blank" rel="noopener noreferrer">
            <img :src="sponsorEntity.avatarUrl" :alt="sponsorEntity.name" class="rounded-full w-12">
          </a>
        </li>
      </ul> -->
      </sponsorssectionlist>
    </article>
    <!-- <article class="mb-12">
      <h2 class="items-center justify-between hidden text-3xl font-semibold u-text-gray-900 md:flex">
        Gold
      </h2>
      <ul class="flex flex-wrap">
        <li v-for="{ sponsorEntity } in data.sponsors.gold" :key="sponsorEntity.login">
          <a :href="`https://github.com/${sponsorEntity.login}`" :title="sponsorEntity.name" target="_blank" rel="noopener noreferrer">
            <img :src="sponsorEntity.avatarUrl" :alt="sponsorEntity.name" class="rounded-full w-12">
          </a>
        </li>
      </ul>
    </article>
    <article class="mb-12">
      <h2 class="items-center justify-between hidden text-3xl font-semibold u-text-gray-900 md:flex">
        Silver
      </h2>
      <ul class="flex flex-wrap">
        <li v-for="{ sponsorEntity } in data.sponsors.silver" :key="sponsorEntity.login">
          <a :href="`https://github.com/${sponsorEntity.login}`" :title="sponsorEntity.name" target="_blank" rel="noopener noreferrer">
            <img :src="sponsorEntity.avatarUrl" :alt="sponsorEntity.name" class="rounded-full w-12">
          </a>
        </li>
      </ul>
    </article>
    <article class="mb-12">
      <h2 class="items-center justify-between hidden text-3xl font-semibold u-text-gray-900 md:flex">
        Bronze
      </h2>
      <ul class="flex flex-wrap">
        <li v-for="{ sponsorEntity } in data.sponsors.bronze" :key="sponsorEntity.login">
          <a :href="`https://github.com/${sponsorEntity.login}`" :title="sponsorEntity.name" target="_blank" rel="noopener noreferrer">
            <img :src="sponsorEntity.avatarUrl" :alt="sponsorEntity.name" class="rounded-full w-12">
          </a>
        </li>
      </ul>
    </article>
    <article class="mb-12">
      <h2 class="items-center justify-between hidden text-3xl font-semibold u-text-gray-900 md:flex">
        Backers
      </h2>
      <ul class="flex flex-wrap">
        <li v-for="{ sponsorEntity } in data.sponsors.backer" :key="sponsorEntity.login">
          <a :href="`https://github.com/${sponsorEntity.login}`" :title="sponsorEntity.name" target="_blank" rel="noopener noreferrer">
            <img :src="sponsorEntity.avatarUrl" :alt="sponsorEntity.name" class="rounded-full w-12">
          </a>
        </li>
      </ul>
    </article> -->
  </section>
</template>
