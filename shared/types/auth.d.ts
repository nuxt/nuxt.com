declare module '#auth-utils' {
  interface User {
    id: string
    name: string
    email?: string | null
    avatar: string
    username: string
    provider: 'github'
    providerId: string
    role: 'user' | 'admin'
  }

  interface UserSession {
    /** Stable anonymous principal — survives session token rotation. */
    anonymousUserId?: string
  }
}

export {}
