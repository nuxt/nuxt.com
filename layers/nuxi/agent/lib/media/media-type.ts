import { extname } from 'node:path/posix'

export type MediaType = 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp' | 'video/mp4'

const EXTENSIONS = new Map<string, MediaType>([
  ['png', 'image/png'],
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg'],
  ['gif', 'image/gif'],
  ['webp', 'image/webp'],
  ['mp4', 'video/mp4']
])

/** Media type from the file extension, or null for anything that is not an image or a clip we handle. */
export function mediaTypeFromPath(path: string): MediaType | null {
  return EXTENSIONS.get(extname(path).slice(1).toLowerCase()) ?? null
}

/** The major brands of an MP4 video. ffmpeg writes `isom`. */
const MP4_BRANDS = new Set(['isom', 'iso2', 'iso4', 'iso5', 'iso6', 'mp41', 'mp42', 'avc1'])

function hasBytes(bytes: Uint8Array, offset: number, signature: readonly number[]): boolean {
  return bytes.byteLength >= offset + signature.length && signature.every((byte, index) => bytes[offset + index] === byte)
}

/**
 * Media type from the file's first bytes, or null. A sandbox file is published or committed only
 * when this agrees with its extension, so the extension alone never decides what the bytes are.
 */
export function sniffMediaType(bytes: Uint8Array): MediaType | null {
  if (hasBytes(bytes, 0, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) return 'image/png'
  if (hasBytes(bytes, 0, [0xFF, 0xD8, 0xFF])) return 'image/jpeg'
  if (hasBytes(bytes, 0, [0x47, 0x49, 0x46, 0x38])) return 'image/gif'
  // RIFF....WEBP
  if (hasBytes(bytes, 0, [0x52, 0x49, 0x46, 0x46]) && hasBytes(bytes, 8, [0x57, 0x45, 0x42, 0x50])) return 'image/webp'
  // ....ftyp, then the major brand. AVIF and HEIC images start with the same box, so the brand decides.
  if (hasBytes(bytes, 4, [0x66, 0x74, 0x79, 0x70]) && MP4_BRANDS.has(String.fromCharCode(...bytes.subarray(8, 12)))) return 'video/mp4'
  return null
}

/**
 * The media type of a sandbox file about to leave the sandbox. Its name and its first bytes have
 * to agree, so nothing but a real image or clip leaves under a media name.
 */
export function checkedMediaType(name: string, bytes: Uint8Array, maxBytes: number): MediaType {
  const mediaType = mediaTypeFromPath(name)
  if (!mediaType) throw new Error(`"${name}" is not a png, jpg, gif, webp or mp4 file.`)
  if (bytes.byteLength > maxBytes) throw new Error(`"${name}" is ${bytes.byteLength} bytes; the limit is ${maxBytes}.`)
  if (sniffMediaType(bytes) !== mediaType) throw new Error(`The content of "${name}" does not match its extension.`)
  return mediaType
}
