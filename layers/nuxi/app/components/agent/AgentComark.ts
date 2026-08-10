import shiki from '@comark/nuxt/plugins/shiki'
import SourceLink from '#layers/nuxi/app/components/tools/SourceLink.vue'

export default defineMarkdownComponent({
  name: 'AgentComark',
  plugins: [
    shiki()
  ],
  components: {
    'source-link': SourceLink
  },
  class: '*:first:mt-0 *:last:mb-0'
})
