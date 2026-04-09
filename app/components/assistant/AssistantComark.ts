import highlight from '@comark/nuxt/plugins/highlight'
import AssistantSourceLink from './AssistantSourceLink.vue'

export default defineComarkComponent({
  name: 'AssistantComark',
  plugins: [
    highlight()
  ],
  components: {
    'source-link': AssistantSourceLink
  },
  class: '*:first:mt-0 *:last:mb-0'
})
