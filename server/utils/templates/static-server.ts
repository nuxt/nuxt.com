/** Serves a directory of prerendered files (`.output/public` by default, or the directory passed as first argument). Written into the sandbox by the check job. */
export const STATIC_SERVER_PATH = '/vercel/nuxt-com-static-server.mjs'

export const STATIC_SERVER = `import { createServer } from 'node:http'
import { createReadStream, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'

const root = join(process.cwd(), process.argv[2] || '.output/public')
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.txt': 'text/plain', '.xml': 'application/xml', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.woff2': 'font/woff2' }

createServer((req, res) => {
  let pathname
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
  } catch {
    return res.writeHead(400).end()
  }
  const path = normalize(pathname).replace(/^(\\.\\.[/\\\\])+/, '')
  for (const [candidate, status] of [[path, 200], [join(path, 'index.html'), 200], [path + '.html', 200], ['/200.html', 200], ['/404.html', 404]]) {
    const file = join(root, candidate)
    try {
      if (!statSync(file).isFile()) continue
      res.writeHead(status, { 'content-type': types[extname(file)] || 'application/octet-stream' })
      return createReadStream(file).pipe(res)
    } catch {}
  }
  res.writeHead(404).end()
}).listen(Number(process.env.PORT) || 3000, '0.0.0.0')
`

/** Starts the template's production build. The check job writes it from the preview command Nitro prints, so it follows each template's preset and output directory. */
export const SERVE_SCRIPT_PATH = '/vercel/nuxt-com-serve.sh'
