import highlight from '@comark/nuxt/plugins/highlight'
import SourceLink from '../tools/SourceLink.vue'

export default defineComarkComponent({
  name: 'AgentComark',
  plugins: [
    highlight()
  ],
  components: {
    'source-link': SourceLink
  },
  class: '*:first:mt-0 *:last:mb-0'
})
