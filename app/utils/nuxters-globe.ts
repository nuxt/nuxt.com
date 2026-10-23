/** The radius of the cobe sphere, in its clip space. */
const GLOBE_RADIUS = 0.8

export interface GlobeProjection {
  /** > 0 on the visible side */
  depth: number
  x: number
  y: number
}

/** Project a latitude/longitude with the rotation of cobe (`phi`, `theta`): same math as its shader. */
export function projectOnGlobe(out: GlobeProjection, [latitude, longitude]: readonly [number, number], phi: number, theta: number, scale: number): void {
  const lat = latitude * Math.PI / 180
  const lng = longitude * Math.PI / 180 - Math.PI
  const cosLat = Math.cos(lat)
  const x = -cosLat * Math.cos(lng) * GLOBE_RADIUS
  const y = Math.sin(lat) * GLOBE_RADIUS
  const z = cosLat * Math.sin(lng) * GLOBE_RADIUS
  const sinPhi = Math.sin(phi)
  const cosPhi = Math.cos(phi)
  const sinTheta = Math.sin(theta)
  const cosTheta = Math.cos(theta)
  out.depth = -sinPhi * cosTheta * x + sinTheta * y + cosPhi * cosTheta * z
  out.x = (cosPhi * x + sinPhi * z) * scale
  out.y = -(sinPhi * sinTheta * x + cosTheta * y - cosPhi * sinTheta * z) * scale
}

/** The camera (`phi`, `theta`) that faces a latitude/longitude. */
export function faceOnGlobe([latitude, longitude]: readonly [number, number]): { phi: number, theta: number } {
  return {
    phi: Math.PI - (longitude * Math.PI / 180 - Math.PI / 2),
    theta: Math.min(1.45, Math.max(-1.45, latitude * Math.PI / 180))
  }
}

/**
 * The outline of a count marker: a capsule `width` wide and `height` tall, with a tail `tail` long under its middle.
 * One path, so one stroke draws the whole shape. The tail leaves the flat bottom, or the round end on narrow ones.
 */
export function pinPath(width: number, height: number, tail: number, base = 5): string {
  const r = height / 2
  const middle = width / 2
  // Where the tail leaves the capsule, on the right: on the flat bottom, or on the right end.
  const right = middle + base
  const onEnd = right > width - r
  const dx = right - (width - r)
  const rightY = onEnd ? r + Math.sqrt(r * r - dx * dx) : height
  const leftX = width - right
  const tip = height + tail
  const n = (value: number) => +value.toFixed(2)
  return [
    `M${n(r)} 0H${n(width - r)}`,
    onEnd ? `A${r} ${r} 0 0 1 ${n(right)} ${n(rightY)}` : `A${r} ${r} 0 0 1 ${n(width - r)} ${height}H${n(right)}`,
    `L${n(middle + 1.5)} ${n(tip - 1.5)}Q${n(middle)} ${tip} ${n(middle - 1.5)} ${n(tip - 1.5)}L${n(leftX)} ${n(rightY)}`,
    onEnd ? `A${r} ${r} 0 0 1 ${n(r)} 0Z` : `H${n(r)}A${r} ${r} 0 0 1 ${n(r)} 0Z`
  ].join('')
}
