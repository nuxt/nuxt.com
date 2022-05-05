<template>
  <div class="absolute top-0 left-0 mt-8 grid grid-cols-12 w-full h-[300px]">
    <div class="relative -top-40 lg:top-0 u-bg-gray-900 rounded-md col-span-full lg:col-span-7 p-5 overflow-hidden">
      <div class="fromscratch-code-wrapper-anim">
        <div class="opacity-100 fromscratch-code-bash-anim">
          <p class="flex">
            <span class="text-white">&gt;&nbsp;</span><span class="fromscratch-yarn-addnuxt text-white">yarn add <span class="text-green">nuxt</span></span>
          </p>
          <p class="fromscratch-loading-anim opacity-0 text-white">
            > Loading...
          </p>
          <div class="fromscratch-progressbars-install mt-2 w-1/2">
            <div class="fromscratch-progressbar-anim u-bg-gray-400" />
            <div class="fromscratch-progressbar-anim u-bg-gray-500" />
            <div class="fromscratch-progressbar-anim u-bg-gray-600" />
          </div>
          <p class="flex">
            <span class="opacity-0 fromscratch-seconddollar-anim text-white">&gt;&nbsp;</span><span class="fromscratch-yarn-rundev text-white">yarn run dev</span>
          </p>
          <div class="fromscratch-progressbars-dev mt-2 w-1/2">
            <div class="fromscratch-progressbar-anim u-bg-gray-400" />
            <div class="fromscratch-progressbar-anim u-bg-gray-500" />
            <div class="fromscratch-progressbar-anim u-bg-gray-600" />
          </div>
          <p class="flex items-center opacity-0 fromscratch-compiled-anim text-white">
            <UIcon name="heroicons-outline:check" />
            compiled
          </p>
        </div>
        <div class="absolute top-0 left-0 w-full pt-8 h-full opacity-0 fromscratch-code-ide-anim">
          <div class="absolute h-10 lg:w-full top-6 -left-5 border-b-2 border-gray-200 w-[112%]">
            <div class="flex h-full w-full items-center pl-4">
              <span class="rounded-full mr-2 u-bg-gray-500 h-[12px] w-[12px]" />
              <span class="rounded-full mr-2 u-bg-gray-500 h-[12px] w-[12px]" />
              <span class="rounded-full mr-2 u-bg-gray-500 h-[12px] w-[12px]" />
            </div>
            <p class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-400">
              index.vue
            </p>
          </div>
          <div class="absolute top-[70px] w-12 -left-5 border-r-2 u-border-gray-400 flex flex-col items-center justify-start pt-3 h-[103%]" />
          <div class="pl-12 pt-12 fromscratch-code-ide-content">
            <p>
              <!-- Template tag open -->
              <span class="text-white">&lt;</span><span class="text-blue-500">template</span><span class="text-white">&gt;&nbsp;</span>
            </p>
            <p><span class="text-white">&lt;</span><span class="text-green-500">div</span><span class="text-white">&gt;&nbsp;</span></p>
            <p>
              <!-- Sidebar component -->
              <span class="text-white">&lt;</span><span class="text-green-500">Sidebar</span><span class="text-white">/&gt;&nbsp;</span>
            </p>
            <p>
              <!-- Hello world h1 -->
              <span class="text-white">&lt;</span>
              <span class="text-green-500">h1</span>
              <span class="text-white">&gt;&nbsp;</span><span class="text-white">Hello world!</span><span class="text-white">&lt;</span><span class="text-white">&#47;</span><span class="text-green-500">h1</span>
              <span class="text-white">&gt;&nbsp;</span>
            </p>
            <p><span class="text-white">&lt;</span><span class="text-white">&#47;</span><span class="text-green-500">div</span><span class="text-white">&gt;&nbsp;</span></p>
            <p>
              <!-- Template tag open -->
              <span class="text-white">&lt;</span><span class="text-white">&#47;</span><span class="text-blue-500">template</span><span class="text-white">&gt;&nbsp;</span>
            </p>
          </div>
        </div>
      </div>
    </div>
    <div class="absolute bg-gray-100 right-0 lg:top-1/2 transform -translate-y-1/2 rounded-md w-full lg:w-1/2 opacity-0 overflow-hidden top-[95%] h-[120%] fromscratch-display-anim">
      <div class="overflow-hidden opacity-0 fromscratch-display-loading-anim">
        <Logo class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-[80px]" />
        <div class="absolute left-1/2 transform -translate-x-1/2 bottom-8 w-1/2 fromscratch-display-progressbar-anim">
          <div class="absolute left-0 top-0 w-full u-bg-gray-400 rounded-full h-[10px]" />
          <div class="absolute left-0 top-0 w-0 u-bg-gray-500 rounded-full opacity-0 h-[10px] fromscratch-display-progressbar-progress " />
        </div>
      </div>
      <div class="absolute top-0 left-0 h-full w-full">
        <img loading="lazy" src="/docs/framework/v2/sidebar.svg" class="absolute top-0 h-full left-[-150px] fromscratch-display-content-img-anim" alt="sidebar illustration">
        <p class="fromscratch-display-content-p-anim absolute top-4 left-6 font-bold text-2xl u-text-gray-600 opacity-0">
          Hello world!
        </p>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>

.fromscratch-display-anim {
  animation: appear 300ms cubic-bezier(0.83, 0, 0.17, 1) forwards 3.2s,
    slideRight 300ms cubic-bezier(0.83, 0, 0.17, 1) forwards 3.2s;
}
.fromscratch-display-loading-anim {
  animation: appear 300ms cubic-bezier(0.83, 0, 0.17, 1) forwards 3.5s, disappear 200ms forwards 7.7s;
}

.fromscratch-display-content-img-anim {
  animation: slideSidebarRight 600ms cubic-bezier(0.83, 0, 0.17, 1) forwards 9s;
}

.fromscratch-display-content-p-anim {
  animation: appear 300ms cubic-bezier(0.83, 0, 0.17, 1) forwards 8.1s,
      slideContent 600ms cubic-bezier(0.83, 0, 0.17, 1) forwards 9s;
}

.fromscratch-display-progressbar-anim {
  animation: fadeOutSlideDown 500ms cubic-bezier(0.83, 0, 0.17, 1) forwards 5.3s;
}

.fromscratch-display-progressbar-progress-anim {
  animation: progress cubic-bezier(0.83, 0, 0.17, 1) 1.5s forwards 3.8s;
}

.fromscratch-code-bash-anim {
  animation: disappear ease 200ms forwards 6.7s;
}

.fromscratch-code-wrapper-anim {
  animation: slideUp cubic-bezier(0.83, 0, 0.17, 1) 1s forwards 5.5s;
}

span[class*='fromscratch-yarn'] {
  @apply inline-block overflow-hidden whitespace-nowrap w-0;
  border-right: 0.15em solid transparent;
  letter-spacing: 0.75px;
  &.fromscratch-yarn-addnuxt {
    animation: typingSmall 1.5s steps(12, end) forwards, blink-caret 0.75s step-end 4 backwards;
  }
  &.fromscratch-yarn-rundev {
    animation: typingRunDev 1.5s steps(12, end) forwards 3.2s, blink-caret 0.75s step-end 4 backwards 3.2s;
  }
}

.fromscratch-seconddollar-anim {
  animation: appear 150ms ease forwards 3.2s;
}

.fromscratch-loading-anim {
  animation: appear 150ms forwards 2.15s;
}

.fromscratch-progressbars-install {
  & .fromscratch-progressbar-anim {
    &:nth-child(1) {
      animation-delay: 2.4s;
    }
    &:nth-child(2) {
      animation-delay: 2.6s;
    }
    &:nth-child(3) {
      animation-delay: 2.8s;
    }
  }
}

.fromscratch-progressbars-dev {
  & .fromscratch-progressbar-anim {
    &:nth-child(1) {
      animation-delay: 4.8s;
    }
    &:nth-child(2) {
      animation-delay: 5s;
    }
    &:nth-child(3) {
      animation-delay: 5.2s;
    }
  }
}

.fromscratch-progressbar-anim {
  @apply rounded-full mb-2 opacity-0 w-0;
  height: 10px;
  animation: progress cubic-bezier(0.83, 0, 0.17, 1) 700ms forwards;
}

.fromscratch-compiled-anim {
  animation: appear 150ms forwards 5.7s;
}

.fromscratch-code-ide-anim {
  animation: appear 150ms forwards ease 7s;
}

.fromscratch-code-ide-content {
  white-space: unset;
  & p {
    @apply overflow-hidden whitespace-nowrap w-0;
    border-right: 0.15em solid transparent;
    letter-spacing: 0.75px;
  }
  & p:nth-child(2),
  & p:nth-child(5) {
    @apply ml-3;
  }
  & p:nth-child(3),
  & p:nth-child(4) {
    @apply ml-6;
  }
  & p:nth-child(1),
  & p:nth-child(2) {
    animation: typingSmall 400ms steps(12, end) forwards 7.3s;
  }
  & p:nth-child(3) {
    height: 0;
    animation: typingSmall 400ms steps(12, end) forwards 9s, heightAppear 100ms ease forwards 9s;
  }
  & p:nth-child(4) {
    animation: typingLong 400ms steps(12, end) forwards 7.7s;
  }
  & p:nth-child(5) {
    animation: typingSmall 400ms steps(12, end) forwards 8.1s;
  }
  & p:nth-child(6) {
    animation: typingSmall 400ms steps(12, end) forwards 8.3s;
  }
}

@keyframes typingSmall {
  from {
    width: 0;
  }
  to {
    width: 130px;
  }
}

@keyframes typingRunDev {
  from {
    width: 0;
  }
  to {
    width: 120px;
  }
}

@keyframes typingLong {
  from {
    width: 0;
  }
  to {
    width: 280px;
  }
}

@keyframes blink-caret {
  from,
  to {
    border-color: transparent;
  }
  50% {
    border-color: #00dc82;
  }
}

@keyframes appear {
  0% {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes progress {
  0% {
    width: 0;
  }
  15% {
    opacity: 1;
  }
  to {
    opacity: 1;
    width: 100%;
  }
}

@keyframes slideUp {
  0% {
    transform: translateY(0);
  }
  to {
    transform: translateY(-46px);
  }
}

@keyframes slideRight {
  0% {
    transform: translateX(-100px) translateY(-50%);
  }
  to {
    transform: translateX(0) translateY(-50%);
  }
}

@keyframes fadeOutSlideDown {
  0% {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(40px);
  }
}

@keyframes disappear {
  0% {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes growUp {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes slideSidebarRight {
  0% {
    left: -150px;
  }
  100% {
    @apply left-0;
  }
}

@keyframes heightAppear {
  0% {
    height: 0;
  }
  to {
    height: 26px;
  }
}

@keyframes slideContent {
  0% {
    @apply left-8;
  }
  100% {
    @apply left-28;
  }
}
</style>
