// https://vercel.com/docs/routing-middleware/getting-started

export const config = {
  runtime: 'nodejs' // default is 'edge'
}

export default function middleware(request: Request) {
  const url = new URL(request.url)

  // Redirect docs URLs to raw markdown versions
  if (request.headers.get('accept')?.includes('text/markdown') && url.pathname.startsWith('/docs/')) {
    const newPath = `/raw${url.pathname}.md`
    return new Response(null, {
      status: 302,
      headers: { Location: newPath }
    })
  }

  return fetch(request)
}
