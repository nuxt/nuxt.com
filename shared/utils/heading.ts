/** Strips emoji from a heading so it reads cleanly in navigation and search results. */
export function plainHeading(text: string) {
  return text
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\u200D/g, '')
    .replace(/\uFE0F/g, '')
    .trim()
}
