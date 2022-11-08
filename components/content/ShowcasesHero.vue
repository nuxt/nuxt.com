<template>
  <PageHero>
    <template #title>
      <ContentSlot :use="$slots.title" unwrap="p" />
    </template>
    <template #description>
      <ContentSlot :use="$slots.description" unwrap="p" />
    </template>

    <template #extra>
      <div class="gap-3 flex-col sm:flex-row items-center hidden lg:flex">
        <span class="u-text-gray-500">Download extension:</span>
        <div class="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <UButton variant="secondary" icon="logos:chrome" to="https://chrome.google.com/webstore/detail/vue-telescope/neaebjphlfplgdhedjdhcnpjkndddbpd" target="_blank">
            Chrome
          </UButton>
          <UButton variant="secondary" icon="logos:firefox" to="https://addons.mozilla.org/en/firefox/addon/vue-telescope/" target="_blank">
            Firefox
          </UButton>
          <UButton variant="secondary" icon="logos:microsoft-edge" to="https://microsoftedge.microsoft.com/addons/detail/vue-telescope/icgcillpgelpleniodgkmohgdmeogodl" target="_blank">
            Edge
          </UButton>
        </div>
      </div>
    </template>

    <template #image>
      <div class="flex h-full items-center justify-center">
        <img src="/assets/showcase/hero-light.svg" class="dark:hidden object-contain h-3/4 lg:mx-10 opacity-0 md:opacity-100" role="presentation">
        <img src="/assets/showcase/hero-dark.svg" class="hidden dark:block object-contain h-3/4 lg:mx-10 opacity-0 md:opacity-100" role="presentation">
      </div>
    </template>
  </PageHero>
</template>
