/** Python's standard library is available in the sandbox; no ZIP dependency is needed in the app. */
export const PROJECT_ARCHIVE_SCRIPT = `
import os, sys, zipfile

excluded = {'node_modules', '.nuxt', '.output', '.data', '.git', '.vercel', '.cache', 'dist'}
helpers = {'nuxt-com-preview.client.js', 'nuxt-com-preview.js'}
with zipfile.ZipFile(sys.argv[1], 'w', zipfile.ZIP_DEFLATED) as archive:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in excluded and not os.path.islink(os.path.join(root, d))]
        for name in files:
            path = os.path.join(root, name)
            if name not in helpers and not os.path.islink(path) and os.path.isfile(path):
                archive.write(path, os.path.relpath(path, '.'))
`
