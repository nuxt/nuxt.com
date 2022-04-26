<template>
  <div class="absolute top-0 left-0 mt-8 grid grid-cols-12 w-full">
    <div class="relative -top-40 lg:top-0 u-bg-gray-900 rounded-md col-span-full lg:col-span-7 p-5 overflow-hidden h-[280px]">
      <div class="fromcli-code-wrapper-anim">
        <div class="opacity-100 fromcli-code-bash-anim">
          <p class="flex">
            <span>$&nbsp;</span><span class="fromcli-yarn-createnuxtapp-anim">npx
              <span class="u-text-500">create-nuxt-app</span>
              project-name</span>
          </p>
          <p class="fromcli-loading-anim opacity-0">
            > Loading...
          </p>
          <div class="mt-2 w-1/2 fromcli-progressbars-install">
            <div class="fromcli-progressbar-anim u-bg-gray-400" />
            <div class="fromcli-progressbar-anim u-bg-gray-500" />
          </div>
          <p class="opacity-0 fromcli-question1-anim">
            <span class="u-text-gray-500">? </span> Project name :
            <span class="u-text-gray-500">My project</span>
          </p>
          <p class="fromcli-question2-anim">
            <span class="u-text-gray-500">? </span> Programming language :
            <span class="opacity-0 u-text-gray-500 fromcli-question2-answer-anim">Javascript</span>
          </p>
          <p class="opacity-0 overflow-hidden fromcli-question2-answer1-anim">
            > Javascript
          </p>
          <p class="opacity-0 overflow-hidden fromcli-question2-answer2-anim">
            &nbsp;&nbsp;Typescript
          </p>
          <p class="h-0 overflow-hidden fromcli-question3-anim">
            <span class="u-text-gray-500">? </span> Package manager :
            <span class="u-text-gray-500">Yarn</span>
          </p>
          <p class="h-0 overflow-hidden fromcli-question4-anim">
            <span class="u-text-gray-500">? </span> UI Framework :
            <span class="u-text-gray-500">Tailwind CSS</span>
          </p>
          <p class="h-0 overflow-hidden fromcli-question5-anim">
            <span class="u-text-gray-500">? </span> Nuxt modules :
            <span class="u-text-gray-500">Axios</span>
          </p>
          <p class="h-0 overflow-hidden fromcli-question6-anim">
            <span class="u-text-gray-500">? </span> Testing Framework :
            <span class="u-text-gray-500">Jest</span>
          </p>
          <p class="h-0 overflow-hidden fromcli-question7-anim">
            <span class="u-text-gray-500">? </span> Rendering mode :
            <span class="u-text-gray-500">Universal (SSR / SSG)</span>
          </p>
          <p class="h-0 overflow-hidden fromcli-question8-anim">
            <span class="u-text-gray-500">? </span> Deployment target :
            <span class="u-text-gray-500">Server</span>
          </p>
          <div class="mt-2 w-1/2 fromcli-progressbars-compilation">
            <div class="fromcli-progressbar-anim" />
            <div class="fromcli-progressbar-anim" />
          </div>
          <p class="flex items-center opacity-0 fromcli-installed-anim">
            <IconCheck class="mr-2 nui-icon-md u-text-gray-500 w-4 h-4" />
            installed
          </p>
          <p class="flex">
            <span class="opacity-0 fromcli-seconddollar-anim">$&nbsp;</span><span class="fromcli-yarn-cd">cd <span class="u-text-gray-500">My Project</span></span>
          </p>
          <p class="flex">
            <span class="opacity-0 fromcli-thirddollar-anim">$&nbsp;</span><span class="fromcli-yarn-run-anim">yarn run <span class="u-text-gray-500">dev</span></span>
          </p>
        </div>
        <div class="absolute left-0 w-full pt-8 h-full opacity-0 top-[162px] fromcli-code-ide-anim">
          <div class="absolute h-10 w-full top-4 -left-5 border-b-2 u-border-gray-400">
            <div class="flex h-full w-full items-center pl-4">
              <span class="h-3 w-3 rounded-full mr-2 u-bg-gray-500" />
              <span class="h-3 w-3 rounded-full mr-2 u-bg-gray-500" />
              <span class="h-3 w-3 rounded-full mr-2 u-bg-gray-500" />
            </div>
            <p class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 u-text-gray-50">
              index.vue
            </p>
          </div>
          <div class="absolute w-12 -left-5 border-r-2 u-border-gray-400 flex flex-col items-center justify-start pt-3 top-[65px] h-[103%]">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
            <span>6</span>
            <span>7</span>
            <span>8</span>
            <span>9</span>
          </div>
          <div class="pl-12 pt-10 fromcli-code-ide-content">
            <p>
              <span>&lt;</span><span class="text-red-400">{{ 'template' }}</span><span>&gt;</span>
            </p>
            <p><span>&lt;</span><span class="text-red-400">div</span><span>&gt;</span></p>
            <p>
              <!-- Logo component -->
              <span>&lt;</span><span class="text-red-400">Logo</span><span>/&gt;</span>
            </p>
            <p>
              <!-- Nuxt Card component -->
              <span>&lt;</span><span class="text-red-400">NuxtCard</span><span>&#47;&gt;</span>
            </p>
            <p>
              <!-- Nuxt Card component -->
              <span>&lt;</span><span class="text-red-400">NuxtCard</span><span>&#47;&gt;</span>
            </p>
            <p>
              <!-- AlertBanner component -->
              <span>&lt;</span><span class="text-red-400">AlertBanner</span><span>&#47;&gt;</span>
            </p>
            <p><span>&lt;&#47;</span><span class="text-red-400">div</span><span>&gt;</span></p>
            <p>
              <span>&lt;</span>&#47;<span class="text-red-400">{{ 'template' }}</span><span>&gt;</span>
            </p>
          </div>
        </div>
      </div>
    </div>
    <div class="absolute u-bg-gray-100 right-0 top-full lg:top-1/2 transform -translate-y-1/2 rounded-md w-full lg:w-1/2 opacity-0 overflow-hidden h-[120%] fromcli-display-anim">
      <div class="overflow-hidden opacity-0 fromcli-display-loading-anim">
        <img loading="lazy" class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-[60px]" src="~/static/img/home/learn/master/logo.svg">
        <div class="absolute left-1/2 transform -translate-x-1/2 bottom-8 w-1/2 fromcli-display-progressbar-anim">
          <div class="absolute left-0 top-0 w-full bg-gray-400 rounded-full h-[10px]" />
          <div class="absolute left-0 top-0 w-0 u-bg-gray-500 rounded-full opacity-0 h-[10px] fromcli-display-progressbar-progress-anim" />
        </div>
      </div>
      <div class="absolute top-0 left-0 h-full w-full flex flex-col justify-center items-start px-16 fromcli-display-content">
        <img loading="lazy" src="~/static/img/home/learn/master/logo.svg">
        <img
          loading="lazy"
          src="~/static/img/home/learn/master/cliContent1.svg"
        >
        <img
          loading="lazy"
          src="~/static/img/home/learn/master/cliContent2.svg"
        >
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.fromcli-display-anim {
  animation: appear 300ms cubic-bezier(0.83, 0, 0.17, 1) forwards 3.2s,
    slideRight 300ms cubic-bezier(0.83, 0, 0.17, 1) forwards 3.2s;
}

.fromcli-display-loading-anim {
  animation: appear 300ms cubic-bezier(0.83, 0, 0.17, 1) forwards 3.5s, disappear 200ms forwards 10.4s;
}

.fromcli-display-content {
  & img {
    @apply opacity-0;
    transform: translateY(40px);
  }
  & img:first-child {
    @apply self-start mb-4;
    height: 36px;
    animation: slideUpContent 300ms cubic-bezier(0.83, 0, 0.17, 1) forwards 10.9s,
      appear 150ms cubic-bezier(0.83, 0, 0.17, 1) forwards 10.9s;
  }
  & img:nth-child(2) {
    @apply mb-4 w-full;
    animation: slideUpContent 300ms cubic-bezier(0.83, 0, 0.17, 1) forwards 11.1s,
      appear 150ms cubic-bezier(0.83, 0, 0.17, 1) forwards 11.1s;
  }
  & img:last-child {
    @apply w-full;
    animation: slideUpContent 300ms cubic-bezier(0.83, 0, 0.17, 1) forwards 11.3s,
      appear 150ms cubic-bezier(0.83, 0, 0.17, 1) forwards 11.3s;
  }
}

.fromcli-display-progressbar-anim {
  animation: fadeOutSlideDown 500ms cubic-bezier(0.83, 0, 0.17, 1) forwards 5.3s;
}

.fromcli-display-progressbar-progress-anim {
  animation: progress cubic-bezier(0.83, 0, 0.17, 1) 1.5s forwards 3.8s;
}

.fromcli-code-bash-anim {
  animation: disappear ease 200ms forwards 10.4s;
}

.fromcli-code-wrapper-anim {
  animation: slideUp ease 1.3s forwards 5s;
}

span[class*='fromcli__yarn'] {
  @apply inline-block overflow-hidden whitespace-nowrap w-0;
  border-right: 0.15em solid transparent;
  letter-spacing: 0.75px;
  &.fromcli-yarn-createnuxtapp-anim {
    animation: typingVeryLong 1.5s steps(12, end) forwards, blink-caret 0.75s step-end 4 backwards;
  }
  &.fromcli-yarn-cd-anim {
    animation: typingSmall 1s steps(12, end) forwards 7.6s, blink-caret 0.75s step-end 2 backwards 7.6s;
  }
  &.fromcli-yarn-run-anim {
    animation: typingRunDev 1s steps(12, end) forwards 8.6s, blink-caret 0.75s step-end 3 backwards 8.6s;
  }
}

.fromcli-seconddollar-anim {
  animation: appear 150ms ease forwards 7.6s;
}

.fromcli-thirddollar-anim {
  animation: appear 150ms ease forwards 8.6s;
}

.fromcli-question1-anim {
  animation: appear 150ms ease forwards 3.2s;
}

.fromcli-question2-anim {
  animation: appear 150ms ease forwards 3.35s;
}

.fromcli-question2-answer-anim {
  animation: appear 150ms ease forwards 4.2s;
}

.fromcli-question2-answer1-anim {
  animation: appear 150ms ease forwards 3.5s, heightDisappear 150ms ease forwards 4.2s;
}

.fromcli-question2-answer2-anim {
  animation: appear 150ms ease forwards 3.65s, heightDisappear 150ms ease forwards 4.2s;
}

.fromcli-question3-anim {
  animation: heightAppear 150ms ease forwards 4.6s;
}

.fromcli-question4-anim {
  animation: heightAppear 150ms ease forwards 4.75s;
}

.fromcli-question5-anim {
  animation: heightAppear 150ms ease forwards 4.9s;
}

.fromcli-question6-anim {
  animation: heightAppear 150ms ease forwards 5.05s;
}

.fromcli-question-anim {
  animation: heightAppear 150ms ease forwards 5.2s;
}

.fromcli-question8-anim {
  animation: heightAppear 150ms ease forwards 5.35s;
}

.fromcli-loading-anim {
  animation: appear 150ms forwards 2.15s;
}

.fromcli-progressbars-compilation-anim {
  & .fromcli-progressbar-anim {
    &:nth-child(1) {
      animation-delay: 5.8s;
    }
    &:nth-child(2) {
      animation-delay: 6.2s;
    }
  }
}

.fromcli-progressbars-install {
  & .fromcli__progressbar {
    &:nth-child(1) {
      @apply u-bg-gray-400;
      animation-delay: 2.4s;
    }
    &:nth-child(2) {
      @apply u-bg-gray-500;
      animation-delay: 2.6s;
    }
  }
}

.fromcli__progressbars__dev {
  @apply mt-2 w-1/4;
  & .fromcli__progressbar {
    &:nth-child(1) {
      @apply u-bg-gray-400;
      animation-delay: 4.8s;
    }
    &:nth-child(2) {
      @apply u-bg-gray-500;
      animation-delay: 5s;
    }
    &:nth-child(3) {
      @apply bg-green-500;
      animation-delay: 5.2s;
    }
  }
}

.fromcli-progressbar-anim {
  height: 10px;
  animation: progress cubic-bezier(0.83, 0, 0.17, 1) 700ms forwards;
}

.fromcli-installed-anim {
  animation: appear 150ms forwards 7s;
}

.fromcli-code-ide-anim {
  animation: appear 150ms forwards ease 10.6s;
}

.fromcli__code__ide__content {
  white-space: unset;
  & p {
    @apply whitespace-nowrap;
    border-right: 0.15em solid transparent;
    letter-spacing: 0.75px;
  }
  & p:nth-child(2) {
    @apply ml-3;
  }
  & p:nth-child(3),
  & p:nth-child(4),
  & p:nth-child(5),
  & p:nth-child(6) {
    @apply ml-6;
  }
  & p:nth-child(7) {
    @apply ml-3;
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

@keyframes typingVeryLong {
  from {
    width: 0;
  }
  to {
    width: 330px;
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
    transform: translateY(-200px);
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

@keyframes slideUpContent {
  0% {
    transform: translateY(40px);
  }
  to {
    transform: translateY(0);
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

@keyframes heightDisappear {
  0% {
    height: 26px;
  }
  to {
    height: 0;
  }
}

@keyframes slideContent {
  0% {
    @apply left-8;
  }
  100% {
    @apply left-30;
  }
}
</style>
