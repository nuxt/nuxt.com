<script setup lang="ts">
const { data } = await useFetch('/api/sponsors')
</script>

<template>
  <section>
    <h1>Sponsors</h1>
    <div class="flex flex-wrap">
      <article v-for="{ tier, sponsorEntity } in data.sponsors" :key="sponsorEntity.login">
        <a
          :href="`https://github.com/${sponsorEntity.login}`"
        >
          <img
            :src="sponsorEntity.avatarUrl"
            class="rounded-full w-12"
          ></a>
      </article>
    </div>
  </section>
</template>
