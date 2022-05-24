<template>
  <PageHero>
    <template #title>
      <Markdown :use="$slots.title" unwrap="p" />
    </template>
    <template #description>
      <Markdown :use="$slots.description" unwrap="p" />
    </template>

    <template #extra>
      <div class="flex gap-4">
        <span class="u-text-gray-500">Download extension:</span>
        <div class="flex gap-6">
          <NuxtLink to="https://chrome.google.com/webstore/detail/vue-telescope/neaebjphlfplgdhedjdhcnpjkndddbpd" target="_blank" class="font-semibold u-text-gray-900 hover:underline">
            Chrome
          </NuxtLink>
          <NuxtLink to="https://addons.mozilla.org/en/firefox/addon/vue-telescope/" target="_blank" class="font-semibold u-text-gray-900 hover:underline">
            Firefox
          </NuxtLink>
        </div>
      </div>
    </template>

    <template #image>
      <img src="/assets/resources/showcases/gems.svg" class="object-contain h-full mx-10 opacity-30 sm:opacity-100">
    </template>
  </PageHero>
</template>
