/** The signed-in user, as the app and the server routes see it. */
export interface AuthUser {
  id: string
  name: string
  email?: string | null
  avatar: string
  username: string
  provider: 'github'
  providerId: string
  role: 'user' | 'admin'
}
