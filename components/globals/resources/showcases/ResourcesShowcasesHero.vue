<template>
  <UContainer padded class="py-12">
    <div class="flex flex-col-reverse md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      <div class="flex flex-col space-y-5 lg:col-span-2 justify-center py-8">
        <h1 class="font-semibold text-5xl u-text-gray-900">
          <Markdown use="title" unwrap="p" />
        </h1>
        <p class="font-medium text-lg u-text-gray-500 max-w-xl">
          <Markdown use="description" unwrap="p" />
        </p>
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
      </div>

      <div class="flex items-center justify-center lg:col-span-1">
        <img src="/gems.svg" class="h-[280px]">
      </div>
    </div>
  </UContainer>
</template>
