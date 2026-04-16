function stripWww(host: string): string {
  return host.replace(/^www\./, '')
}

export function getDomain(url: string): string {
  try {
    return stripWww(new URL(url).hostname)
  } catch {
    // ignore
  }

  try {
    return stripWww(new URL(`https://${url}`).hostname)
  } catch {
    // ignore
  }

  const host = url.split('/')[0]?.split('?')[0] ?? url
  return stripWww(host)
}

export function getFaviconUrl(url: string): string {
  return `https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(getDomain(url))}`
}
