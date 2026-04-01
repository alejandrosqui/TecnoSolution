import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  full_name: string
  is_superadmin: boolean
}

export interface BranchContext {
  branch_id: string
  branch_name: string
  company_id: string
  company_name: string
  role: string
}

interface AuthState {
  user: User | null
  access_token: string | null
  refresh_token: string | null
  isAuthenticated: boolean
  branches: BranchContext[]
  activeBranchId: string | null
  activeCompanyId: string | null
  login: (access_token: string, refresh_token: string, user: User) => void
  setContext: (branches: BranchContext[]) => void
  logout: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      access_token: null,
      refresh_token: null,
      isAuthenticated: false,
      branches: [],
      activeBranchId: null,
      activeCompanyId: null,
      login: (access_token, refresh_token, user) => {
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', refresh_token)
        set({ user, access_token, refresh_token, isAuthenticated: true })
      },
      setContext: (branches) => {
        const first = branches[0]
        set({
          branches,
          activeBranchId: first?.branch_id ?? null,
          activeCompanyId: first?.company_id ?? null,
        })
      },
      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({
          user: null,
          access_token: null,
          refresh_token: null,
          isAuthenticated: false,
          branches: [],
          activeBranchId: null,
          activeCompanyId: null,
        })
      },
      setUser: (user) => set({ user }),
    }),
    { name: 'tecnosolution-auth' }
  )
)
