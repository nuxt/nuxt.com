
<template>
  <ul class="flex items-center justify-end gap-3">
    <li>
      <AppButton
        icon="uil:twitter"
        variant="transparent"
        to="https://twitter.com/nuxt_js"
        target="_blank"
        class="!p-0 u-text-gray-900 focus-visible:ring-2"
        title="Go to Nuxt Twitter Account"
      >
        <span class="sr-only">Go to Nuxt Twitter Account</span>
      </AppButton>
    </li>
    <li>
      <AppButton
        icon="fa-brands:discord"
        variant="transparent"
        to="https://discord.com/invite/ps2h6QT"
        target="_blank"
        class="!p-0 u-text-gray-900 focus-visible:ring-2"
        title="Go to Nuxt Discord Server"
      >
        <span class="sr-only">Go to Nuxt Discord Server</span>
      </AppButton>
    </li>
    <li>
      <AppButton
        icon="uil:github"
        variant="transparent"
        to="https://github.com/nuxt/nuxt"
        target="_blank"
        class="!p-0 u-text-gray-900 focus-visible:ring-2"
        title="Go to Nuxt Github page"
      >
        <span class="sr-only">Go to Nuxt Github page</span>
      </AppButton>
    </li>
  </ul>
</template>
