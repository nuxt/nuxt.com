/** `text` with every search term of `query` wrapped in `<mark>`. */
export default defineComponent({
  props: {
    text: { type: String, required: true },
    query: { type: String, required: true }
  },
  setup(props) {
    return () => highlightParts(props.text, props.query).map(part => part.match
      ? h('mark', { class: 'rounded-xs bg-primary/15 text-highlighted' }, part.text)
      : part.text)
  }
})
