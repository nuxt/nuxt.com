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
