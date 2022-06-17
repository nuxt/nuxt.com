import { unref, Ref } from 'vue'
import type { Awareness } from 'y-protocols/awareness'
import colors from '~/presets/colors'
import type { User } from '~/types'

const cursorColorKeys = [
  'blue',
  'green',
  'indigoblue',
  'lightblue',
  'orange',
  'pear',
  'pink',
  'purple',
  'red',
  'royalblue',
  'ruby',
  'teal'
] as const

const cursorPalette = cursorColorKeys.map(key => colors[key]['500'])

// Pick a random color by prioritizing palettes (first must be fully used before picking from the second)
const pickColor = (palette: string[], exclude: string[]) => {
  // Define available colors for this palette
  const colors = palette.filter(color => !exclude.includes(color))

  // If the palette has available colors, pick a random one
  if (colors.length) {
    return colors[Math.floor(Math.random() * colors.length)]
  }

  // If there are no colors available, it will fallback to a random color in the palette
  return palette[Math.floor(Math.random() * palette.length)]
}

export const setCursor = (awareness: Awareness) => {
  const name = (unref(useStrapiUser() as Ref<User>) || {}).username || 'Anonymous'

  awareness.setLocalStateField('user', { name })

  const onAwarenessChange = () => {
    awareness.off('change', onAwarenessChange)

    const usedColors = Array.from(awareness.getStates().values())
      .map(state => state.user.color)
      .filter(Boolean)

    const color = pickColor(cursorPalette, usedColors)

    awareness.setLocalStateField('user', {
      name,
      color
    })
  }

  awareness.on('change', onAwarenessChange)
}
