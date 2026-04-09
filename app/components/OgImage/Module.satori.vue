<script setup lang="ts">
import { useRequestURL } from 'nuxt/app'
import { encodePath, joinURL } from 'ufo'

defineProps({
  icon: { type: String, default: '' },
  npm: { type: String, default: '' },
  headline: { type: String, default: '' },
  title: { type: String, required: true },
  description: { type: String, default: '' }
})

// 1024² via IPX: dense registry SVGs need a heavier raster than flat wordmarks (Satori + same-origin /_ipx fetch).
const IPX_ICON_PNG = 'f_png&q_100&s_1024x1024'

function ogOrigin() {
  const requestURL = useRequestURL()
  return requestURL.host ? requestURL.origin : 'https://nuxt.com'
}

function ipxPngUrl(source: string) {
  return joinURL(ogOrigin(), '/_ipx', IPX_ICON_PNG, encodePath(source))
}

function registryIconFile(icon: string) {
  const f = icon.replace(/^\//, '')
  return /\.[a-z0-9]+$/i.test(f) ? f : `${f}.svg`
}

function moduleImageSrc(icon: string) {
  if (!icon)
    return ''

  if (/^https?:\/\//.test(icon)) {
    if (/\.svg(?:\?|$)/i.test(icon))
      return ipxPngUrl(icon)
    return icon
  }

  return ipxPngUrl(`/gh/nuxt/modules/main/icons/${registryIconFile(icon)}`)
}
</script>

<template>
  <div class="relative flex h-[600px] w-[1200px] flex-col overflow-hidden bg-[#010B18]">
    <div
      aria-hidden="true"
      class="absolute inset-0"
      style="background: radial-gradient(ellipse 100% 65% at 50% -12%, rgba(0, 220, 130, 0.52) 0%, rgba(0, 220, 130, 0.14) 36%, transparent 58%), linear-gradient(to bottom, transparent 0%, #010B18 72%);"
    />
    <div class="relative flex size-full flex-col justify-center px-8">
      <div class="mx-auto flex w-full max-w-[1000px] flex-row items-center justify-between gap-8">
        <div class="min-w-0 flex flex-col">
          <p v-if="headline" class="mb-4 text-[26px] font-semibold text-[#00DC82]">
            {{ headline }}
          </p>
          <h1 class="m-0 flex max-w-[850px] items-center text-[65px] font-semibold text-white">
            <span>{{ title }}</span>
          </h1>
          <p v-if="description" class="max-w-[700px] text-[34px] text-[#E4E4E7]">
            {{ description.slice(0, 200) }}
          </p>
        </div>
        <div class="flex size-[200px] shrink-0 items-center justify-center">
          <img
            v-if="icon"
            :src="moduleImageSrc(icon)"
            :alt="npm || ''"
            width="200"
            height="200"
            class="size-[200px] object-contain"
          >
        </div>
      </div>
    </div>
    <div class="absolute inset-x-0 bottom-0 flex justify-center pb-6 pt-2">
      <svg viewBox="0 0 256 168" xmlns="http://www.w3.org/2000/svg" width="50" height="33" preserveAspectRatio="xMidYMid">
        <path fill="#00DC82" d="M143.618 167.029h95.166c3.023 0 5.992-.771 8.61-2.237a16.963 16.963 0 0 0 6.302-6.115 16.324 16.324 0 0 0 2.304-8.352c0-2.932-.799-5.811-2.312-8.35L189.778 34.6a16.966 16.966 0 0 0-6.301-6.113 17.626 17.626 0 0 0-8.608-2.238c-3.023 0-5.991.772-8.609 2.238a16.964 16.964 0 0 0-6.3 6.113l-16.342 27.473-31.95-53.724a16.973 16.973 0 0 0-6.304-6.112A17.638 17.638 0 0 0 96.754 0c-3.022 0-5.992.772-8.61 2.237a16.973 16.973 0 0 0-6.303 6.112L2.31 141.975A16.302 16.302 0 0 0 0 150.325c0 2.932.793 5.813 2.304 8.352a16.964 16.964 0 0 0 6.302 6.115 17.628 17.628 0 0 0 8.61 2.237h59.737c23.669 0 41.123-10.084 53.134-29.758l29.159-48.983 15.618-26.215 46.874 78.742h-62.492l-15.628 26.214Zm-67.64-26.24-41.688-.01L96.782 35.796l31.181 52.492-20.877 35.084c-7.976 12.765-17.037 17.416-31.107 17.416Z" />
      </svg>
    </div>
  </div>
</template>
