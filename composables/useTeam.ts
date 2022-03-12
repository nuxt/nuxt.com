import type { Ref } from 'vue'
import type { User } from '~/types'

export const useTeam = () => {
  const user = useStrapiUser() as Ref<User>

  const cookie = useCookie('team', { path: '/' })
  if (!cookie.value) {
    cookie.value = user.value?.username
  }
  const team = useState('team', () => cookie.value)

  watch(team, () => {
    cookie.value = team.value
  })
  watch(user, () => {
    team.value = user.value?.username
  })

  return team
}
