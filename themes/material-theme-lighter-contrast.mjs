import materialThemeLighter from 'shiki/themes/material-theme-lighter.mjs'

const MUTED = '#90A4AE'
/** Blue Grey 700 — ~6.9:1 on Material Lighter `#FAFAFA` (AA). */
const EMPHASIS = '#455A64'

function isCommentScope(scope) {
  const value = Array.isArray(scope) ? scope.join(',') : String(scope || '')
  return /\bcomment\b|docstring/i.test(value)
}

function patchTokenColors(tokenColors = []) {
  return tokenColors.map((token) => {
    if (token.settings?.foreground !== MUTED || isCommentScope(token.scope)) {
      return token
    }

    return {
      ...token,
      settings: {
        ...token.settings,
        foreground: EMPHASIS
      }
    }
  })
}

/** Material Theme Lighter with stronger variable/default text contrast. */
export default {
  ...materialThemeLighter,
  name: 'material-theme-lighter-contrast',
  colors: {
    ...materialThemeLighter.colors,
    'editor.foreground': EMPHASIS
  },
  tokenColors: patchTokenColors(materialThemeLighter.tokenColors)
}
