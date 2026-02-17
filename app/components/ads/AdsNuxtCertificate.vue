<script setup lang="ts">
const video = ref<HTMLVideoElement>()
const isHovered = ref(false)
const hasPlayedTeaser = useState('hasPlayedCertificateTeaser', () => false)

onMounted(() => {
  if (!video.value || hasPlayedTeaser.value) return
  video.value.currentTime = 0
  hasPlayedTeaser.value = true
  video.value.play()

  setTimeout(() => {
    if (!video.value || isHovered.value) return
    reverseVideoToZero()
  }, 600)
})

// Reverse the video to the beginning with a smooth transition
let interval
function reverseVideoToZero() {
  if (!video.value) return
  if (interval) {
    clearInterval(interval)
    interval = null
  }
  if (video.value.currentTime <= 0) return
  video.value.pause()
  interval = setInterval(() => {
    if (isHovered.value) return
    video.value.currentTime = Math.max(0, video.value.currentTime - 0.05)
    if (video.value.currentTime <= 0) {
      clearInterval(interval)
      interval = null
    }
  }, 50)
}

const handleMouseEnter = () => {
  isHovered.value = true
  if (!video.value) return
  if (interval) {
    clearInterval(interval)
    interval = null
  }
  video.value.play()
}

const handleMouseLeave = () => {
  isHovered.value = false
  if (!video.value) return
  reverseVideoToZero()
}
</script>

<template>
  <div class="group relative border border-default rounded-md hover:bg-elevated/50 w-full transition-colors p-2">
    <ULink
      to="https://certification.nuxt.com"
      target="_blank"
      class="absolute inset-0 z-10"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    />
    <div class="flex justify-center w-full aspect-video">
      <video
        ref="video"
        class="w-full rounded-sm"
        poster="https://res.cloudinary.com/nuxt/video/upload/so_0/v1763564406/nuxt-certificate-black-friday-2025_hfskaj.jpg"
        muted
        playsinline
      >
        <source src="https://res.cloudinary.com/nuxt/video/upload/v1763564406/nuxt-certificate-black-friday-2025_hfskaj.mp4" type="video/mp4">
      </video>
    </div>

    <div class="font-bold text-sm text-muted transition-colors group-hover:text-default pt-2">
      <UBadge color="warning" variant="soft" label="Black Friday Week" />
    </div>

    <div class="text-xs text-muted py-1 transition-colors group-hover:text-default">
      Get 60% off and bonuses on all Official Nuxt Certifications.
    </div>
  </div>
</template>
