import rangi from '@comark/nuxt/plugins/rangi'
import SourceLink from '#layers/nuxi/app/components/tools/SourceLink.vue'

export default defineMarkdownComponent({
  name: 'AgentComark',
  plugins: [
    rangi()
  ],
  components: {
    'source-link': SourceLink
  },
  class: '*:first:mt-0 *:last:mb-0'
})
