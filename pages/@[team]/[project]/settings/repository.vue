<template>
  <div class="space-y-6">
    <UCard padded>
      <h2 class="text-lg font-medium leading-6 u-text-gray-900">
        Connected Git Repository
      </h2>
      <p class="mt-1 text-sm u-text-gray-400">
        The Git Repository connected to your project.
      </p>
      <UCard class="mt-6" body-class="flex flex-col items-center justify-between gap-3 p-4 sm:flex-row">
        <div class="flex items-center justify-center gap-4">
          <UIcon name="fa-brands:github" class="w-6 h-6" />
          <div class="flex flex-col">
            <div class="flex items-center justify-center gap-1">
              <div class="font-semibold u-text-gray-900">
                repo/project placeholder
              </div>
              <UIcon name="heroicons-solid:external-link" class="w-4 h-4" />
            </div>
            <div class="text-sm u-text-gray-400">
              Time ago placeholder
            </div>
          </div>
        </div>
        <UButton label="Disconnect" size="sm" />
      </UCard>
    </UCard>
  </div>
</template>
