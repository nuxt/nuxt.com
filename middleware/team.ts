export default defineNuxtRouteMiddleware((to) => {
  const team = useTeam()

  team.value = to.params.team as string
})
