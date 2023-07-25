export const usePageNotFound = (page: any) => {
  if ((!page.value || !page.value._id) && process.server) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found', message: 'Page not found' })
  }
}
