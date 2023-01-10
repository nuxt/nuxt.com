<template>
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
