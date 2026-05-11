declare module '#auth-utils' {
  interface User {
    id: string
    name: string
    email: string
    avatar: string
    username: string
    provider: 'github'
    providerId: string
    role: 'user' | 'admin'
  }
}

export {}
