import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, Loader2, ShieldCheck, Wrench, ClipboardList, Crown } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { userService, ROLES } from '@/app/services/userService'
import { useAuthStore } from '@/app/store/authStore'
import { toast } from 'sonner'

// ── Helpers ───────────────────────────────────────────────────────────────────

const roleIcon = (role: string) => {
  if (role === 'admin') return <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
  if (role === 'tecnico') return <Wrench className="w-3.5 h-3.5 text-amber-500" />
  if (role === 'recepcionista') return <ClipboardList className="w-3.5 h-3.5 text-green-500" />
  if (role === 'superadmin') return <Crown className="w-3.5 h-3.5 text-purple-500" />
  return null
}

const roleLabel = (role: string) =>
  ROLES.find(r => r.value === role)?.label ?? role

// ── Schemas ───────────────────────────────────────────────────────────────────

const userSchema = z.object({
  full_name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  phone: z.string().optional(),
})

const roleSchema = z.object({
  role: z.string().min(1),
})

type UserFormData = z.infer<typeof userSchema>
type RoleFormData = z.infer<typeof roleSchema>

// ── Component ─────────────────────────────────────────────────────────────────

export function UsersPage() {
  const queryClient = useQueryClient()
  const { activeBranchId } = useAuthStore()
  const [userDialog, setUserDialog] = useState(false)
  const [roleDialog, setRoleDialog] = useState<string | null>(null) // user_id
  const [isSaving, setIsSaving] = useState(false)
  const [search, setSearch] = useState('')

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: userService.listWithRoles,
  })

  const filtered = users.filter(u =>
    [u.full_name, u.email].some(v => v.toLowerCase().includes(search.toLowerCase()))
  )

  const selectedUser = users.find(u => u.id === roleDialog)
  const currentAccess = selectedUser?.branch_access.find(a => a.branch_id === activeBranchId)

  const userForm = useForm<UserFormData>({ resolver: zodResolver(userSchema) })
  const roleForm = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: { role: currentAccess?.role ?? 'tecnico' },
  })

  const onCreateUser = async (data: UserFormData) => {
    setIsSaving(true)
    try {
      await userService.create(data)
      await queryClient.invalidateQueries({ queryKey: ['users-with-roles'] })
      toast.success('Usuario creado')
      userForm.reset()
      setUserDialog(false)
    } catch {
      toast.error('Error al crear el usuario')
    } finally {
      setIsSaving(false)
    }
  }

  const onAssignRole = async (data: RoleFormData) => {
    if (!roleDialog || !activeBranchId) return
    setIsSaving(true)
    try {
      await userService.assignBranchAccess(roleDialog, activeBranchId, data.role)
      await queryClient.invalidateQueries({ queryKey: ['users-with-roles'] })
      toast.success('Rol asignado')
      setRoleDialog(null)
    } catch {
      toast.error('Error al asignar el rol')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-1">{users.length} usuarios registrados</p>
        </div>
        <Button onClick={() => setUserDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo usuario
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Buscar por nombre o email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users className="w-10 h-10 mb-3" />
            <p className="text-sm font-medium">No hay usuarios</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rol en esta sucursal</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(u => {
                  const access = u.branch_access.find(a => a.branch_id === activeBranchId)
                  const role = u.is_superadmin ? 'superadmin' : access?.role
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900">{u.full_name}</td>
                      <td className="px-6 py-3 text-gray-500">{u.email}</td>
                      <td className="px-6 py-3">
                        {role ? (
                          <span className="flex items-center gap-1.5 text-gray-700">
                            {roleIcon(role)}
                            {roleLabel(role)}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">Sin acceso</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`text-xs font-semibold ${u.is_active ? 'text-green-600' : 'text-red-500'}`}>
                          {u.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        {!u.is_superadmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              roleForm.reset({ role: access?.role ?? 'tecnico' })
                              setRoleDialog(u.id)
                            }}
                          >
                            {access ? 'Cambiar rol' : 'Asignar rol'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Dialog: Nuevo usuario ── */}
      <Dialog open={userDialog} onOpenChange={open => { setUserDialog(open); if (!open) userForm.reset() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nuevo usuario</DialogTitle></DialogHeader>
          <form onSubmit={userForm.handleSubmit(onCreateUser)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre completo *</Label>
              <Input placeholder="Juan Pérez" {...userForm.register('full_name')} />
              {userForm.formState.errors.full_name && <p className="text-xs text-red-500">{userForm.formState.errors.full_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" placeholder="juan@taller.com" {...userForm.register('email')} />
              {userForm.formState.errors.email && <p className="text-xs text-red-500">{userForm.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Contraseña *</Label>
              <Input type="password" placeholder="Mínimo 8 caracteres" {...userForm.register('password')} />
              {userForm.formState.errors.password && <p className="text-xs text-red-500">{userForm.formState.errors.password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input placeholder="+54 9 297 123-4567" {...userForm.register('phone')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setUserDialog(false); userForm.reset() }}>Cancelar</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Crear usuario
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Asignar rol ── */}
      <Dialog open={!!roleDialog} onOpenChange={open => { if (!open) setRoleDialog(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Asignar rol — {selectedUser?.full_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={roleForm.handleSubmit(onAssignRole)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Rol en esta sucursal</Label>
              <select
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
                {...roleForm.register('role')}
              >
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRoleDialog(null)}>Cancelar</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
