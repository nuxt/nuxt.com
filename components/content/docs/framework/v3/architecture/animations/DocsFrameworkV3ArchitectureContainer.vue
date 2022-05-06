<template>
  <svg width="617" height="552" viewBox="0 0 617 552" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_4235_46744)">
      <path d="M60.063 36.8764V90.7529C61.8996 215.24 65.5729 466.419 65.5729 475.235C65.5729 484.051 72.1034 487.072 75.3686 487.48C239.651 484.419 570.298 478.174 578.624 477.684C586.95 477.194 588.624 470.949 588.42 467.888C584.134 354.013 575.563 123.324 575.563 111.569C575.563 99.8139 570.665 96.0589 568.216 95.6507C405.77 71.9777 78.6748 24.5093 69.8587 24.0195C61.0425 23.5297 59.6548 32.3867 60.063 36.8764Z" fill="currentColor" :fill-opacity="opacity" shape-rendering="crispEdges" />
    </g>
    <defs>
      <filter
        id="filter0_d_4235_46744"
        x="0"
        y="0"
        width="616.436"
        height="551.48"
        filterUnits="userSpaceOnUse"
        color-interpolation-filters="sRGB"
      >
        <feFlood flood-opacity="0" result="BackgroundImageFix" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <feOffset dx="-16" dy="20" />
        <feGaussianBlur stdDeviation="22" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.09 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_4235_46744" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_4235_46744" result="shape" />
      </filter>
    </defs>
  </svg>
</template>

<script setup lang="ts">
defineProps({
  opacity: {
    type: Number,
    default: 0.3
  }
})
</script>
