<script setup lang="ts">
const props = withDefaults(defineProps<{
  title: string
  description?: string
  highlight?: string
  detail?: boolean
  category?: string
  label?: string
  credit?: string
  image?: string
  starter?: boolean
}>(), { detail: false })

const titleSize = computed(() => props.title.length > 48 ? 56 : props.title.length > 24 ? 64 : 88)

const previewStyle = (left: number, top: number, width: number, height: number, flush = false) => ({
  position: 'absolute' as const,
  left, top, width, height,
  display: 'flex',
  overflow: 'hidden' as const,
  backgroundColor: '#101010',
  borderRadius: flush ? '6px 0 0 6px' : '6px',
  border: '1px solid rgba(255,255,255,0.18)'
})
</script>

<template>
  <div :style="{ width: 1200, height: 630, display: 'flex', position: 'relative', overflow: 'hidden', backgroundColor: '#0a0a0a', fontFamily: 'Inter', fontWeight: 400, color: '#fafafa' }">
    <img src="/assets/design-kit/logo-green-white.svg" alt="Nuxt" :style="{ position: 'absolute', left: 1024, top: 68, width: 112, height: 28 }">

    <template v-if="!detail">
      <div class="font-heading font-medium" :style="{ position: 'absolute', left: 64, top: 55, width: 900, height: 94, fontFamily: 'Outfit', fontWeight: 500, fontSize: 80, lineHeight: 1.06, letterSpacing: -2.1 }">
        {{ title }}
      </div>
      <div class="font-heading font-medium" :style="{ position: 'absolute', left: 64, top: 140, width: 900, height: 94, fontFamily: 'Outfit', fontWeight: 500, fontSize: 80, lineHeight: 1.06, letterSpacing: -2.1, color: '#00dc82' }">
        {{ highlight }}
      </div>
      <div :style="{ position: 'absolute', left: 67, top: 247, width: 950, height: 38, fontSize: 25, color: '#a5a9a7' }">
        {{ description }}
      </div>
      <div v-for="(slug, index) in ['nuxt-ui-landing', 'nuxt-ui-dashboard', 'docus']" :key="slug" :style="previewStyle(64 + index * 365, 326, 342, 192)">
        <img :src="`/assets/templates/${slug}.webp`" alt="" :style="{ position: 'absolute', left: 0, top: 0, width: 342, height: 192.375 }">
      </div>
    </template>

    <template v-else>
      <div :style="{ position: 'absolute', left: 64, top: 55, width: 1136, display: 'flex', flexDirection: 'column', gap: 40 }">
        <div :style="{ display: 'flex', flexDirection: 'column', gap: 20, minHeight: 197 }">
          <div class="font-heading font-medium" :style="{ width: 880, fontFamily: 'Outfit', fontWeight: 500, fontSize: titleSize, lineHeight: 1.06, letterSpacing: -2.1, lineClamp: 2, textOverflow: 'ellipsis', overflow: 'hidden', overflowWrap: 'anywhere' }">
            {{ title }}
          </div>
          <div :style="{ marginLeft: 2, width: 1000, fontSize: 25, lineHeight: 1.4, color: '#a5a9a7', lineClamp: 2, textOverflow: 'ellipsis', overflow: 'hidden', overflowWrap: 'anywhere' }">
            {{ description }}
          </div>
        </div>
        <div :style="{ display: 'flex', gap: 53 }">
          <div :style="{ width: 312, display: 'flex', flexDirection: 'column', gap: 22 }">
            <div :style="{ height: 36, display: 'flex', alignItems: 'center', gap: 12 }">
              <div :style="{ fontSize: 20, color: '#e2e5e3' }">
                {{ category }}
              </div>
              <div v-if="label" :style="{ width: 6, height: 6, borderRadius: 6, backgroundColor: '#444b47' }" />
              <div v-if="label" :style="{ fontSize: 19, color: '#969d99' }">
                {{ label }}
              </div>
            </div>
            <div :style="{ width: 312, fontSize: 20, lineHeight: 1.4, color: '#a5a9a7', lineClamp: 2, textOverflow: 'ellipsis', overflow: 'hidden', overflowWrap: 'anywhere' }">
              {{ credit }}
            </div>
          </div>
          <div :style="{ ...previewStyle(0, 0, 771, 434, true), position: 'relative', flexShrink: 0 }">
            <img v-if="image" :src="image" alt="" :style="{ position: 'absolute', left: 0, top: 0, width: 771, height: 433.6875 }">
            <div v-else-if="starter" :style="{ display: 'flex', flexDirection: 'column', gap: 24, padding: 20 }">
              <div :style="{ fontSize: 20, color: '#a5afa9' }">
                app.vue
              </div>
              <div :style="{ fontFamily: 'monospace', fontSize: 30, color: '#00dc82' }">
                &lt;template&gt;
              </div>
              <div :style="{ fontFamily: 'monospace', fontSize: 30, whiteSpace: 'pre' }">
                &lt;h1&gt;Hello, Nuxt.&lt;/h1&gt;
              </div>
              <div :style="{ fontFamily: 'monospace', fontSize: 30, color: '#00dc82' }">
                &lt;/template&gt;
              </div>
            </div>
            <div v-else class="font-heading font-medium" :style="{ display: 'flex', padding: 36, fontFamily: 'Outfit', fontWeight: 500, fontSize: 54 }">
              Built with Nuxt.
            </div>
          </div>
        </div>
      </div>
      <div :style="{ position: 'absolute', left: 64, top: 561, width: 312, height: 28, fontSize: 18, color: '#858b88' }">
        nuxt.com/templates
      </div>
    </template>
  </div>
</template>
