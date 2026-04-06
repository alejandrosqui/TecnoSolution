import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Shield, Plus, Loader2, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { warrantyService, WarrantyCreate } from '@/app/services/warrantyService'
import { toast } from 'sonner'

// ── Schemas ───────────────────────────────────────────────────────────────────

const warrantySchema = z.object({
  work_order_id: z.string().min(1, 'Ingresá el ID de la orden'),
  warranty_months: z.string().min(1),
  starts_at: z.string().min(1, 'Seleccioná la fecha de inicio'),
  terms: z.string().optional(),
})

const claimSchema = z.object({
  description: z.string().min(1, 'Describí el reclamo'),
})

type WarrantyFormData = z.infer<typeof warrantySchema>
type ClaimFormData = z.infer<typeof claimSchema>

// ── Helpers ───────────────────────────────────────────────────────────────────

const today = new Date()

const warrantyStatus = (expires_at: string, is_active: boolean) => {
  if (!is_active) return { label: 'Inactiva', color: 'text-gray-400', icon: null }
  const exp = new Date(expires_at)
  const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return { label: 'Vencida', color: 'text-red-600', icon: AlertTriangle }
  if (diffDays <= 15) return { label: `Vence en ${diffDays}d`, color: 'text-amber-500', icon: Clock }
  return { label: 'Vigente', color: 'text-green-600', icon: CheckCircle2 }
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

// ── Component ─────────────────────────────────────────────────────────────────

export function WarrantiesPage() {
  const queryClient = useQueryClient()
  const [warrantyDialog, setWarrantyDialog] = useState(false)
  const [claimDialog, setClaimDialog] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [search, setSearch] = useState('')

  const { data: warranties = [], isLoading } = useQuery({
    queryKey: ['warranties'],
    queryFn: warrantyService.list,
  })

  const filtered = warranties.filter(w =>
    [w.order_number, w.customer_name, w.device_name]
      .filter(Boolean)
      .some(v => v!.toLowerCase().includes(search.toLowerCase()))
  )

  const warrantyForm = useForm<WarrantyFormData>({ resolver: zodResolver(warrantySchema), defaultValues: { warranty_months: '3' } })
  const claimForm = useForm<ClaimFormData>({ resolver: zodResolver(claimSchema) })

  const onCreateWarranty = async (data: WarrantyFormData) => {
    setIsSaving(true)
    try {
      const payload: WarrantyCreate = {
        work_order_id: data.work_order_id,
        warranty_months: parseInt(data.warranty_months),
        starts_at: data.starts_at,
        terms: data.terms || undefined,
      }
      await warrantyService.create(payload)
      await queryClient.invalidateQueries({ queryKey: ['warranties'] })
      toast.success('Garantía registrada')
      warrantyForm.reset()
      setWarrantyDialog(false)
    } catch {
      toast.error('Error al crear la garantía')
    } finally {
      setIsSaving(false)
    }
  }

  const onAddClaim = async (data: ClaimFormData) => {
    if (!claimDialog) return
    setIsSaving(true)
    try {
      await warrantyService.addClaim(claimDialog, data.description)
      await queryClient.invalidateQueries({ queryKey: ['warranties'] })
      toast.success('Reclamo registrado')
      claimForm.reset()
      setClaimDialog(null)
    } catch {
      toast.error('Error al registrar el reclamo')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Garantías</h1>
          <p className="text-sm text-gray-500 mt-1">{warranties.length} garantías registradas</p>
        </div>
        <Button onClick={() => setWarrantyDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva garantía
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Buscar por orden, cliente o equipo..."
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
            <Shield className="w-10 h-10 mb-3" />
            <p className="text-sm font-medium">No hay garantías registradas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Orden</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Equipo</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Inicio</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vencimiento</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reclamos</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(w => {
                  const st = warrantyStatus(w.expires_at, w.is_active)
                  const Icon = st.icon
                  return (
                    <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs text-gray-700">{w.order_number || '—'}</td>
                      <td className="px-6 py-3 font-medium text-gray-900">{w.customer_name || '—'}</td>
                      <td className="px-6 py-3 text-gray-500">{w.device_name || '—'}</td>
                      <td className="px-6 py-3 text-gray-500">{fmtDate(w.starts_at)}</td>
                      <td className="px-6 py-3 text-gray-500">{fmtDate(w.expires_at)}</td>
                      <td className={`px-6 py-3 font-semibold ${st.color}`}>
                        <span className="flex items-center gap-1">
                          {Icon && <Icon className="w-3.5 h-3.5" />}
                          {st.label}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-500">{w.claims.length}</td>
                      <td className="px-6 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { claimForm.reset(); setClaimDialog(w.id) }}
                        >
                          + Reclamo
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Dialog: Nueva garantía ── */}
      <Dialog open={warrantyDialog} onOpenChange={open => { setWarrantyDialog(open); if (!open) warrantyForm.reset() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nueva garantía</DialogTitle></DialogHeader>
          <form onSubmit={warrantyForm.handleSubmit(onCreateWarranty)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>ID de la orden *</Label>
              <Input placeholder="UUID de la orden de trabajo" {...warrantyForm.register('work_order_id')} />
              {warrantyForm.formState.errors.work_order_id && (
                <p className="text-xs text-red-500">{warrantyForm.formState.errors.work_order_id.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Meses de garantía</Label>
                <Input type="number" min="1" max="24" {...warrantyForm.register('warranty_months')} />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha de inicio *</Label>
                <Input type="date" {...warrantyForm.register('starts_at')} />
                {warrantyForm.formState.errors.starts_at && (
                  <p className="text-xs text-red-500">{warrantyForm.formState.errors.starts_at.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Condiciones</Label>
              <Input placeholder="Ej: No incluye daños por líquidos ni golpes" {...warrantyForm.register('terms')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setWarrantyDialog(false); warrantyForm.reset() }}>Cancelar</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Nuevo reclamo ── */}
      <Dialog open={!!claimDialog} onOpenChange={open => { if (!open) setClaimDialog(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Registrar reclamo</DialogTitle></DialogHeader>
          <form onSubmit={claimForm.handleSubmit(onAddClaim)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Descripción del problema *</Label>
              <Input placeholder="El equipo presenta el mismo problema..." {...claimForm.register('description')} />
              {claimForm.formState.errors.description && (
                <p className="text-xs text-red-500">{claimForm.formState.errors.description.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setClaimDialog(null)}>Cancelar</Button>
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
