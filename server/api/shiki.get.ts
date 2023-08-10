import shiki from 'shiki'

export default eventHandler(async (event) => {
  const highlighter = await shiki.getHighlighter({
    theme: 'nord'
  })
  return highlighter.codeToHtml(`console.log('shiki');`, { lang: 'js' })
})