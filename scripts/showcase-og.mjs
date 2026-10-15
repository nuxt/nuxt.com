// Renders the showcase social card (public/showcase-social.gif): the title framed by a ring of logos cycling through sets.
// Rerun after changing the first sites in content/showcase.yml: `node scripts/showcase-og.mjs`.
// Needs ffmpeg, which encodes only what changes between frames; Takumi's own GIF encoder writes every frame in full.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Renderer } from '@takumi-rs/core'
import { parseYAML } from 'confbox'
import { kebabCase } from 'scule'

const OUTPUT = 'public/showcase-social.gif'
const WIDTH = 1200
const HEIGHT = 630
const COLUMNS = 6
const ROWS = 4
const SETS = 3
const CELL_WIDTH = WIDTH / COLUMNS
const CELL_HEIGHT = HEIGHT / ROWS
const BORDER = '1px solid rgba(255, 255, 255, 0.1)'
const GREEN = '#00DC82'

// Timing mirrors the homepage logo carousel.
const FPS = 20
const HOLD = 2600
const TRANSITION = 900
const STAGGER = 110
const SHIFT = 24
const BLUR = 4

const FONTS = [['Inter', 600], ['Outfit', 500]]
const NUXT_LOGO = '<svg viewBox="0 0 256 168" xmlns="http://www.w3.org/2000/svg"><path fill="#00DC82" d="M143.618 167.029h95.166c3.023 0 5.992-.771 8.61-2.237a16.963 16.963 0 0 0 6.302-6.115 16.324 16.324 0 0 0 2.304-8.352c0-2.932-.799-5.811-2.312-8.35L189.778 34.6a16.966 16.966 0 0 0-6.301-6.113 17.626 17.626 0 0 0-8.608-2.238c-3.023 0-5.991.772-8.609 2.238a16.964 16.964 0 0 0-6.3 6.113l-16.342 27.473-31.95-53.724a16.973 16.973 0 0 0-6.304-6.112A17.638 17.638 0 0 0 96.754 0c-3.022 0-5.992.772-8.61 2.237a16.973 16.973 0 0 0-6.303 6.112L2.31 141.975A16.302 16.302 0 0 0 0 150.325c0 2.932.793 5.813 2.304 8.352a16.964 16.964 0 0 0 6.302 6.115 17.628 17.628 0 0 0 8.61 2.237h59.737c23.669 0 41.123-10.084 53.134-29.758l29.159-48.983 15.618-26.215 46.874 78.742h-62.492l-15.628 26.214Zm-67.64-26.24-41.688-.01L96.782 35.796l31.181 52.492-20.877 35.084c-7.976 12.765-17.037 17.416-31.107 17.416Z"/></svg>'

/** The outer ring of the grid; the middle is left to the title. */
const ring = Array.from({ length: COLUMNS * ROWS }, (_, i) => ({ column: i % COLUMNS, row: Math.floor(i / COLUMNS) }))
  .filter(({ column, row }) => row === 0 || row === ROWS - 1 || column === 0 || column === COLUMNS - 1)
  .map(cell => ({ ...cell, delay: Math.hypot(cell.column - (COLUMNS - 1) / 2, cell.row - (ROWS - 1) / 2) * STAGGER }))
const SET_SIZE = ring.length

const page = parseYAML(readFileSync('content/showcase.yml', 'utf8'))
const sites = page.websites.filter(site => site.logo).slice(0, SET_SIZE * SETS)
const sets = Array.from({ length: SETS }, (_, i) => sites.slice(i * SET_SIZE, (i + 1) * SET_SIZE))

/** Same slug as `getWebsiteLogoUrl()`. */
const logoSrc = site => `${kebabCase(site.name.replace(/[^a-z0-9]/gi, ''))}.svg`

const container = (style, children = []) => ({ type: 'container', style, children })
const text = (value, style) => ({ type: 'text', text: value, style })
const image = (src, style) => ({ type: 'image', src, style })

/** Equal-area sizing like the wall, a touch larger to read as a thumbnail. */
function logoSize({ logo }) {
  const ratio = logo.width / logo.height
  const size = Math.sqrt(0.06 * ratio) * (logo.scale ?? 1)
  const fit = Math.min(1, 0.7 / size, (0.3 * ratio) / size)
  const width = Math.round(size * fit * CELL_WIDTH)
  return { width, height: Math.round(width / ratio) }
}

function logo(site, { shift = 0, blur = 0, opacity = 1 } = {}) {
  const { width, height } = logoSize(site)
  return image(logoSrc(site), {
    position: 'absolute',
    left: (CELL_WIDTH - width) / 2,
    top: (CELL_HEIGHT - height) / 2 + shift,
    width,
    height,
    opacity: opacity * 0.9,
    filter: `brightness(0) invert(1)${blur > 0.05 ? ` blur(${blur.toFixed(2)}px)` : ''}`
  })
}

const easeOut = t => 1 - (1 - t) ** 4

/** One frame: `from` on its own, or `elapsed` ms into its swap for `to`, rippling out from the centre. */
function frame(from, to, elapsed) {
  const cells = ring.map(({ column, row, delay }, i) => {
    const lastColumn = column === COLUMNS - 1
    const lastRow = row === ROWS - 1
    let logos = [logo(from[i])]
    if (elapsed !== undefined) {
      const progress = easeOut(Math.min(1, Math.max(0, (elapsed - delay) / TRANSITION)))
      logos = [
        logo(from[i], { shift: -SHIFT * progress, blur: BLUR * progress, opacity: 1 - progress }),
        logo(to[i], { shift: SHIFT * (1 - progress), blur: BLUR * (1 - progress), opacity: progress })
      ].filter(node => node.style.opacity > 0.01)
    }
    // Ring cells also draw the edges the empty middle would have drawn.
    return container({
      position: 'absolute',
      left: column * CELL_WIDTH,
      top: row * CELL_HEIGHT,
      width: CELL_WIDTH,
      height: CELL_HEIGHT,
      overflow: 'hidden',
      borderRight: lastColumn ? 'none' : BORDER,
      borderBottom: lastRow ? 'none' : BORDER,
      borderTop: lastRow && column > 0 && !lastColumn ? BORDER : 'none',
      borderLeft: lastColumn && row > 0 && !lastRow ? BORDER : 'none'
    }, logos)
  })

  return container({ width: WIDTH, height: HEIGHT, position: 'relative', backgroundColor: '#0a0a0a' }, [
    ...cells,
    container({ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse 30% 30% at 50% 50%, rgba(0, 220, 130, 0.06), transparent)' }),
    container({ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }, [
      image('nuxt.svg', { width: 50, height: 33, marginBottom: 22 }),
      container({ display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'Outfit', fontWeight: 500, fontSize: 64, lineHeight: 1.1 }, [
        text(page.hero.title, { color: 'white' }),
        text(page.hero.highlight, { color: GREEN })
      ])
    ])
  ])
}

const renderer = new Renderer()
for (const [family, weight] of FONTS) {
  const response = await fetch(`https://cdn.jsdelivr.net/fontsource/fonts/${family.toLowerCase()}@latest/latin-${weight}-normal.ttf`)
  if (!response.ok) throw new Error(`Could not download ${family} ${weight}: ${response.status}`)
  await renderer.registerFont({ name: family, weight, data: new Uint8Array(await response.arrayBuffer()) })
}

const images = [
  { src: 'nuxt.svg', data: new TextEncoder().encode(NUXT_LOGO) },
  ...sites.map(site => ({ src: logoSrc(site), data: readFileSync(`public/assets/websites/logos/${logoSrc(site)}`) }))
]

// Each hold is one long frame; only the swaps are sampled.
const scenes = []
const step = 1000 / FPS
const swap = TRANSITION + Math.max(...ring.map(cell => cell.delay))
sets.forEach((from, i) => {
  const to = sets[(i + 1) % SETS]
  scenes.push({ node: frame(from), duration: HOLD })
  for (let elapsed = step; elapsed < swap; elapsed += step) {
    scenes.push({ node: frame(from, to, elapsed), duration: step })
  }
})

const dir = mkdtempSync(join(tmpdir(), 'showcase-og-'))
try {
  const list = []
  for (const [i, scene] of scenes.entries()) {
    const file = `${String(i).padStart(4, '0')}.png`
    writeFileSync(join(dir, file), await renderer.render(scene.node, { width: WIDTH, height: HEIGHT, images }))
    list.push(`file '${file}'`, `duration ${(scene.duration / 1000).toFixed(3)}`)
  }
  // The concat demuxer drops the last entry's duration unless the file is repeated.
  list.push(`file '${String(scenes.length - 1).padStart(4, '0')}.png'`)
  writeFileSync(join(dir, 'frames.txt'), list.join('\n'))

  execFileSync('ffmpeg', [
    '-loglevel', 'error', '-y',
    '-f', 'concat', '-safe', '0', '-i', join(dir, 'frames.txt'),
    '-vf', 'split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle',
    '-loop', '0',
    OUTPUT
  ])
} finally {
  rmSync(dir, { recursive: true, force: true })
}

console.log(`${OUTPUT}: ${scenes.length} frames, ${Math.round(readFileSync(OUTPUT).byteLength / 1024)} KB`)
