import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Wrench, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { authService } from '@/app/services/authService'
import { useAuthStore } from '@/app/store/authStore'
import { useState } from 'react'

const registerSchema = z.object({
  company_name: z.string().min(2, 'El nombre del taller es requerido'),
  full_name: z.string().min(2, 'Tu nombre es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
})

type RegisterForm = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const { login, setContext } = useAuthStore()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (data: RegisterForm) => {
    setServerError(null)
    try {
      const tokens = await authService.register({
        company_name: data.company_name,
        full_name: data.full_name,
        email: data.email,
        password: data.password,
      })
      localStorage.setItem('access_token', tokens.access_token)
      localStorage.setItem('refresh_token', tokens.refresh_token)
      const [me, ctx] = await Promise.all([authService.me(), authService.context()])
      login(tokens.access_token, tokens.refresh_token, {
        id: me.id,
        email: me.email,
        full_name: me.full_name,
        is_superadmin: me.is_superadmin,
      })
      setContext(ctx.branches)
      navigate('/app/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setServerError(msg || 'Error al crear la cuenta. Intentá de nuevo.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Wrench className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TecnoSolution</h1>
          <p className="text-sm text-gray-500 mt-1">Creá tu cuenta gratis</p>
        </div>

        <Card className="shadow-md border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Registrarse</CardTitle>
            <CardDescription>Completá los datos de tu taller</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="company_name">Nombre del taller *</Label>
                <Input id="company_name" placeholder="Ej: TecnoFix Bariloche" {...register('company_name')} />
                {errors.company_name && <p className="text-xs text-red-500">{errors.company_name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="full_name">Tu nombre *</Label>
                <Input id="full_name" placeholder="Juan Pérez" {...register('full_name')} />
                {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" placeholder="juan@taller.com" autoComplete="email" {...register('email')} />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña *</Label>
                <Input id="password" type="password" placeholder="Mínimo 8 caracteres" autoComplete="new-password" {...register('password')} />
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm_password">Repetir contraseña *</Label>
                <Input id="confirm_password" type="password" placeholder="••••••••" autoComplete="new-password" {...register('confirm_password')} />
                {errors.confirm_password && <p className="text-xs text-red-500">{errors.confirm_password.message}</p>}
              </div>

              {serverError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                  {serverError}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creando cuenta...</> : 'Crear cuenta gratis'}
              </Button>

              <p className="text-center text-sm text-gray-500">
                ¿Ya tenés cuenta?{' '}
                <Link to="/login" className="text-blue-600 hover:underline font-medium">
                  Iniciá sesión
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
