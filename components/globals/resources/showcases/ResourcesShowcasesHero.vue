<template>
  <UContainer padded class="py-12">
    <div class="flex justify-between items-center">
      <div class="flex flex-col space-y-5 lg:col-span-2 justify-center py-8">
        <h1 class="font-semibold text-5xl u-text-gray-900">
          <Markdown use="title" unwrap="p" />
        </h1>
        <p class="font-medium text-lg u-text-gray-400 lg:pr-20">
          <Markdown use="description" unwrap="p" />
        </p>
        <div class="flex gap-4">
          <span class="u-text-gray-400">Download extension :</span>
          <div class="flex gap-6">
            <NuxtLink to="https://chrome.google.com/webstore/detail/vue-telescope/neaebjphlfplgdhedjdhcnpjkndddbpd" target="_blank" class="font-semibold u-text-gray-800">
              Chrome
            </NuxtLink>
            <NuxtLink to="https://addons.mozilla.org/en/firefox/addon/vue-telescope/" target="_blank" class="font-semibold u-text-gray-800">
              Firefox
            </NuxtLink>
          </div>
        </div>
      </div>

      <div class="hidden lg:flex flex-shrink-0 place-content-center">
        <img src="/resources/showcases/gems.svg" class="h-[280px]">
      </div>
    </div>
  </UContainer>
</template>
