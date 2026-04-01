import api from './api'
import { BranchContext } from '@/app/store/authStore'

export interface LoginCredentials { email: string; password: string }
export interface TokenResponse { access_token: string; refresh_token: string; token_type: string; expires_in: number }
export interface UserMe { id: string; email: string; full_name: string; is_active: boolean; is_superadmin: boolean; created_at: string }
export interface AuthContext { branches: BranchContext[] }

export const authService = {
  login: async (credentials: LoginCredentials): Promise<TokenResponse> => {
    const { data } = await api.post<TokenResponse>('/api/auth/login', credentials)
    return data
  },
  me: async (): Promise<UserMe> => {
    const { data } = await api.get<UserMe>('/api/auth/me')
    return data
  },
  context: async (): Promise<AuthContext> => {
    const { data } = await api.get<AuthContext>('/api/auth/context')
    return data
  },
}
