export default defineEventHandler(async () => await fetchNotableReleases() ?? [])
