import rangi, { type RangiTheme } from 'comark/plugins/rangi'

/**
 * nuxt.com's code-block palette, ported from the `material-theme-lighter` / `material-theme-palenight`
 */
const MATERIAL_LIGHT: RangiTheme = {
  name: 'nuxt-material-light',
  scheme: 'light',
  bg: '#FAFAFA',
  fg: '#90A4AE',
  tokens: {
    cmnt: '#90A4AE',
    kwd: '#9C3EDA',
    oper: '#39ADB5',
    section: '#39ADB5',
    str: '#91B859',
    esc: '#90A4AE',
    num: '#F76D47',
    bool: '#FF5370',
    func: '#6182B8',
    type: '#E2931D',
    class: '#E2931D',
    var: '#E53935',
    bracket: '#90A4AE',
    insert: '#91B859',
    deleted: '#E53935',
    err: '#E53935'
  }
}

const MATERIAL_DARK: RangiTheme = {
  name: 'nuxt-material-dark',
  scheme: 'dark',
  bg: '#292D3E',
  fg: '#babed8',
  tokens: {
    cmnt: '#676E95',
    kwd: '#C792EA',
    oper: '#89DDFF',
    section: '#89DDFF',
    str: '#C3E88D',
    esc: '#babed8',
    num: '#F78C6C',
    bool: '#ff9cac',
    func: '#82AAFF',
    type: '#FFCB6B',
    class: '#FFCB6B',
    var: '#f07178',
    bracket: '#babed8',
    insert: '#C3E88D',
    deleted: '#f07178',
    err: '#f07178'
  }
}

/**
 * Syntax highlighting for every code fence.
 */
export const highlightPlugin = rangi({
  theme: { light: MATERIAL_LIGHT, dark: MATERIAL_DARK },
  lineNumbers: true
})
