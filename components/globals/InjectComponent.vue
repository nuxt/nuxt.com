<script lang="ts">
export default defineComponent({
  functional: true,
  props: {
    component: {
      type: [String, Object, Array],
      required: true
    },
    tag: {
      type: String,
      default: 'span'
    }
  },
  render () {
    if (typeof this.component === 'string' && this.component !== '' && resolveComponent(this.component)) {
      return h(this.component, this.$data, this.$children)
    }

    return h(this.tag, this.$data, this.$slots.default())
  }
})
</script>
