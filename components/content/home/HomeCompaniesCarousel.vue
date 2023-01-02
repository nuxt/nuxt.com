<template>
  <div class="relative mt-20" aria-hidden="true">
    <div class="overflow-hidden">
      <div class="slider">
        <div class="slide-track mb-2 sm:mb-8 animation">
          <div v-for="(showcase, i) in selectedShowcases" :key="i" class="slide mx-8">
            <a :href="showcase.url" target="_blank" class="w-full h-full relative group" tabindex="-1">
              <img
                :src="`https://res.cloudinary.com/nuxt/image/upload/f_auto,q_auto,w_420,h_315/${showcase.screenshotUrl}`"
                :alt="showcase.hostname"
                loading="lazy"
                class="object-cover w-full h-full px-4 sm:px-0 rounded-lg"
                height="315"
                width="420"
              >
              <div class="px-4 py-3 text-center w-[200px] sm:w-[400px]">
                <h2 class="font-semibold truncate u-text-gray-900 text-xl">
                  {{ showcase.title || showcase.hostname }}
                </h2>
                <p class="truncate text-green-400">
                  {{ showcase.hostname }}
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
    <div
      class="absolute top-0 left-0 h-full w-[20px] sm:w-[50px] md:w-[100px] lg:w-[200px] bg-gradient-to-r from-white dark:from-black via-white/50 dark:via-black/60 to-transparent z-[1]"
    />
    <div
      class="absolute top-0 right-0 h-full w-[20px] sm:w-[50px] md:w-[100px] lg:w-[200px] bg-gradient-to-l from-white dark:from-black via-white/50 dark:via-black/60 to-transparent z-[1]"
    />
  </div>
</template>

<script setup lang="ts">
const { selectedShowcases } = useResourcesShowcases()

</script>

<style scoped lang="postcss">
@keyframes scroll {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(calc(-50%));
  }
}

.slider {
  height: 200px;
  margin: auto;
  position: relative;
  width: 1800%;
}

@media (min-width: 768px) {
  .slider {
    height: 300px;
  }
}

.slider::after {
  right: 0;
  top: 0;
  -webkit-transform: rotateZ(180deg);
  transform: rotateZ(180deg);
}

.slider::before {
  left: 0;
  top: 0;
}

.animation {
  -webkit-animation: scroll 120s linear infinite;
  animation: scroll 120s linear infinite;
}

.slide-track:hover,
.slide-track:hover {
  animation-play-state: paused;
}

.slide-track {
  display: flex;
  width: 100%;
}

.slide {
  height: 100px;
  width: 200px;
}

@media (min-width: 640px) {
  .slide {
    height: 200px;
    width: 400px;
  }
}

.gradient-border {
  opacity: 0;
  margin-top: 1px;
  margin-left: 1px;
  position: absolute;
  top: 0;
  left: 0;
  width: calc(100% + 2px);
  height: calc(100% + 2px);
  background-size: 600% 600%;
  border-radius: 8px;
  z-index: -1;
  transform: translate(-2px, -2px);
}

.gradient-border-light {
  background: linear-gradient(var(--gradient-angle), rgba(0, 220, 130, 1), white, rgba(54, 228, 218, 0.5), rgba(29, 224, 177, 0.3));
}

.gradient-border-dark {
  background: linear-gradient(var(--gradient-angle), rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.1), white, rgba(255, 255, 255, 0.3));
}

.slide:hover {
  .gradient-border {
    opacity: 1;
    animation: gradient-rotate 5s linear 0s infinite reverse;
    transition: all 0.3s linear;
  }
}

@property --gradient-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 360deg;
}

@keyframes gradient-rotate {
  0% {
    --gradient-angle: 360deg;
  }

  100% {
    --gradient-angle: 0deg;
  }
}
</style>
