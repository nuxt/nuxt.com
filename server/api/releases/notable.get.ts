import { defineHandler } from 'nuxt/server'

export default defineHandler(async () => await fetchNotableReleases() ?? [])
