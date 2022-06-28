import { unref } from 'vue'
import type { Awareness } from 'y-protocols/awareness'

interface User {
  username: string
}

const cursorPalette = [
  '#1aadff',
  '#00bd6f',
  '#1a62ff',
  '#1ad6ff',
  '#ff7a1a',
  '#d0d32f',
  '#ff1ab2',
  '#811aff',
  '#ff281a',
  '#4127e8',
  '#ff1a5e',
  '#1cd1c6'
]

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

const getUser = (): User => {
  const strapiUser = typeof useStrapiUser === 'function' && useStrapiUser()
  return (unref(strapiUser) || { username: 'Anonymous' }) as User
}

export const setCursor = (awareness: Awareness) => {
  const name = getUser().username

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
