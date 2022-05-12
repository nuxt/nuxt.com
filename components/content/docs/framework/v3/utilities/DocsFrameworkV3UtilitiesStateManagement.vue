<template>
  <div class="h-8">
    <div class="container flex flex-col gap-y-2">
      <span v-for="(block, i) in 10" :key="i" ref="blocks" class="w-10 h-4 bg-green-400 transition duration-500" />
    </div>
  </div>
</template>

<style scoped>
 .container {
  overflow: hidden;
  height: 55px;
  width: 100%;
  margin: 0 auto;
}

.container span {
  min-height: 16px;
  min-width: 10px;
  animation: slide 10s linear infinite;
}

@keyframes slide {
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(0, -120px, 0); /* The image width */
  }
}
</style>
