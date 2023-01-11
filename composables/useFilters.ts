export const useFilters = () => {
  const route = useRoute()
  const router = useRouter()

  const createReplaceRoute = (entity: string) => {
    return (name: string, param: string | { key: string }) => {
      router.replace({
        name: entity,
        query: {
          ...route.query,
          [name]: typeof param === 'string' ? param : param?.key || undefined
        },
        state: {
          smooth: '#smooth'
        }
      })
    }
  }

  return {
    createReplaceRoute
  }
}
