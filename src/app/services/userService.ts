import api from './api'

export interface BranchAccess {
  branch_id: string
  role: string
  is_active: boolean
}

export interface UserWithRoles {
  id: string
  email: string
  full_name: string
  phone: string | null
  is_active: boolean
  is_superadmin: boolean
  branch_access: BranchAccess[]
}

export interface UserCreate {
  email: string
  full_name: string
  password: string
  phone?: string
}

const ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'recepcionista', label: 'Recepcionista' },
]

export { ROLES }

export const userService = {
  listWithRoles: (): Promise<UserWithRoles[]> =>
    api.get('/api/users/with-roles').then(r => r.data),
  create: (data: UserCreate) =>
    api.post('/api/users/', data).then(r => r.data),
  assignBranchAccess: (user_id: string, branch_id: string, role: string) =>
    api.post(`/api/users/${user_id}/branch-access`, { branch_id, role }).then(r => r.data),
  updateRole: (user_id: string, branch_id: string, role: string) =>
    api.patch(`/api/users/${user_id}/role`, { branch_id, role }).then(r => r.data),
}
