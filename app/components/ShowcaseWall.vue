<script setup lang="ts">
interface Website {
  name: string
  url: string
  logo?: { width: number, height: number, scale?: number }
}

defineProps<{
  websites: Website[]
}>()

// Equal-area sizing so wide wordmarks and compact marks carry the same visual weight.
// Values are fractions of the cell width, applied in container query units.
const LOGO_AREA = 0.04
const LOGO_MAX_WIDTH = 0.62
const LOGO_MAX_HEIGHT = 0.22

function logoWidth({ logo }: Website) {
  if (!logo) return `${LOGO_MAX_WIDTH * 100}cqw`
  const ratio = logo.width / logo.height
  const width = Math.sqrt(LOGO_AREA * ratio) * (logo.scale ?? 1)
  const fit = Math.min(1, LOGO_MAX_WIDTH / width, (LOGO_MAX_HEIGHT * ratio) / width)
  return `${(width * fit * 100).toFixed(2)}cqw`
}
</script>

<template>
  <ul class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 border-t border-l border-default">
    <li v-for="(website, index) in websites" :key="website.url" class="border-r border-b border-default">
      <a
        :href="website.url"
        target="_blank"
        rel="noopener"
        class="@container group relative isolate grid place-items-center aspect-[8/5] overflow-hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
      >
        <NuxtImg
          :src="getWebsiteScreenShotUrl(website)"
          alt=""
          :loading="index < 10 ? 'eager' : 'lazy'"
          width="576"
          height="324"
          sizes="50vw sm:33vw lg:25vw xl:20vw"
          format="webp"
          class="absolute inset-0 -z-10 size-full object-cover object-top brightness-[.36] opacity-0 scale-110 transition-[opacity,scale] duration-500 ease-out group-hover:opacity-100 group-hover:scale-100 group-focus-visible:opacity-100 group-focus-visible:scale-100 pointer-coarse:opacity-100 pointer-coarse:scale-100"
        />
        <BrandLogo
          :src="getWebsiteLogoUrl(website)"
          :alt="website.name"
          :width="website.logo?.width"
          :height="website.logo?.height"
          :style="{ width: logoWidth(website) }"
          class="text-highlighted transition-[color,scale] duration-500 ease-out group-hover:text-white group-hover:scale-105 group-focus-visible:text-white pointer-coarse:text-white"
        />
        <!-- Logos are masks, so this is the only text the browser's find-in-page can match. -->
        <span aria-hidden="true" class="absolute inset-x-3 bottom-3 truncate text-center text-xs text-transparent">
          {{ website.name }}
        </span>
        <UIcon name="i-lucide-arrow-up-right" class="absolute top-3 right-3 size-4 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
      </a>
    </li>
  </ul>
</template>
