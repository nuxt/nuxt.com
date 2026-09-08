<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  videoId: string
  icon?: string
  platform?: 'youtube' | 'vimeo'
}>(), {
  icon: 'i-lucide-video',
  platform: 'youtube'
})
</script>

<template>
  <ProseCallout class="[&>div]:my-0 py-0">
    <UAccordion :items="[{ label: title, icon }]" :ui="{ }">
      <template #body>
        <ScriptYouTubePlayer v-if="platform === 'youtube'" :video-id="videoId" class="group rounded-md overflow-hidden border border-default">
          <template #awaitingLoad>
            <div class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 h-[48px] w-[68px] opacity-75 group-hover:opacity-100 transition-opacity">
              <svg height="100%" version="1.1" viewBox="0 0 68 48" width="100%">
                <path d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#f00" />
                <path d="M 45,24 27,14 27,34" fill="#fff" />
              </svg>
            </div>
          </template>
        </ScriptYouTubePlayer>
        <ScriptVimeoPlayer v-else :id="Number(videoId)" class="group rounded-md overflow-hidden border border-default">
          <template #awaitingLoad>
            <div class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-700 opacity-75 group-hover:opacity-100 transition rounded px-6 py-2">
              <svg width="24" height="24" viewBox="0 0 24 24" class="w-10 h-10 text-white" xmlns="http://www.w3.org/2000/svg"><path d="M19 12C19 12.3557 18.8111 12.6846 18.5039 12.8638L6.50387 19.8638C6.19458 20.0442 5.81243 20.0455 5.50194 19.8671C5.19145 19.6888 5 19.3581 5 19L5 5C5 4.64193 5.19145 4.3112 5.50194 4.13286C5.81243 3.95452 6.19458 3.9558 6.50387 4.13622L18.5039 11.1362C18.8111 11.3154 19 11.6443 19 12Z" fill="currentColor" /></svg>
            </div>
          </template>
        </ScriptVimeoPlayer>
      </template>
    </UAccordion>
  </ProseCallout>
</template>
