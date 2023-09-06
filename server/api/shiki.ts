import { getHighlighterCore, loadWasm } from 'shikiji/core'
import { bundledThemes } from 'shikiji/themes'
import { bundledLanguages } from 'shikiji/langs'

export default lazyEventHandler(async () => {
  try {
    // try loading `.wasm` directly
    const wasm = await import('shikiji/onig.wasm').then(r => r.default)
    await loadWasm(async obj => WebAssembly.instantiate(wasm, obj))
  }
  catch {
    // otherwise fallback to base64 inlined wasm
    await loadWasm({ data: await import('shikiji/wasm').then(r => r.getWasmInlined()).then(r => r.data) })
  }

  const shiki = await getHighlighterCore()

  return eventHandler(async (event) => {
    const {
      code = 'console.log("Hello Nuxt!")',
      lang = 'javascript',
      theme = 'vitesse-light'
    } = {
      ...getQuery(event),
      ...event.node.req.method === 'POST' ? await readBody(event) : {},
    }

    if (!bundledLanguages[lang as keyof typeof bundledLanguages])
      return new Response('Does not support language "' + lang + '"', { status: 400 })
    if (!bundledThemes[theme as keyof typeof bundledThemes])
      return new Response('Does not support theme "' + theme + '"', { status: 400 })

    await Promise.all([
      shiki.loadLanguage(bundledLanguages[lang as keyof typeof bundledLanguages]),
      shiki.loadTheme(bundledThemes[theme as keyof typeof bundledThemes]),
    ])

    return shiki.codeToHtml(code, { lang, theme })
  })
})
