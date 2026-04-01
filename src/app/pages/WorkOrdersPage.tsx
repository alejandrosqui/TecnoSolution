import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, ClipboardList, Search } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { workOrderService, WorkOrderStatus } from '@/app/services/workOrderService'
import { customerService } from '@/app/services/customerService'
import { deviceService } from '@/app/services/deviceService'
import { useAuthStore } from '@/app/store/authStore'
import { STATUS_LABELS, STATUS_COLORS } from './DashboardPage'
import { toast } from 'sonner'

const ALL_STATUSES: WorkOrderStatus[] = [
  'received', 'queued', 'diagnosing', 'waiting_customer_approval', 'quote_sent',
  'approved', 'rejected', 'waiting_parts', 'repairing', 'repaired',
  'ready_for_pickup', 'delivered', 'warranty', 'cancelled',
]

const DEVICE_TYPES = ['smartphone', 'tablet', 'laptop', 'desktop', 'printer', 'console', 'other']
const DEVICE_TYPE_LABELS: Record<string, string> = {
  smartphone: 'Smartphone', tablet: 'Tablet', laptop: 'Laptop',
  desktop: 'PC/Desktop', printer: 'Impresora', console: 'Consola', other: 'Otro',
}

const newOrderSchema = z.object({
  // customer
  customer_mode: z.enum(['existing', 'new']),
  customer_id: z.string().optional(),
  customer_full_name: z.string().optional(),
  customer_email: z.string().optional(),
  customer_phone: z.string().optional(),
  // device
  brand: z.string().min(1, 'Marca requerida'),
  model: z.string().min(1, 'Modelo requerido'),
  device_type: z.string().min(1, 'Tipo requerido'),
  imei: z.string().optional(),
  serial_number: z.string().optional(),
  // order
  problem_description: z.string().min(1, 'Describí el problema'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  estimated_cost: z.string().optional(),
}).superRefine((val, ctx) => {
  if (val.customer_mode === 'existing' && !val.customer_id) {
    ctx.addIssue({ code: 'custom', path: ['customer_id'], message: 'Seleccioná un cliente' })
  }
  if (val.customer_mode === 'new' && !val.customer_full_name) {
    ctx.addIssue({ code: 'custom', path: ['customer_full_name'], message: 'El nombre es requerido' })
  }
})

type NewOrderForm = z.infer<typeof newOrderSchema>

export function WorkOrdersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeBranchId, activeCompanyId } = useAuthStore()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['work-orders', { status: statusFilter }],
    queryFn: () =>
      workOrderService.list(statusFilter !== 'all' ? { status: statusFilter } : undefined),
  })

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', customerSearch],
    queryFn: () => customerService.list(customerSearch || undefined),
    enabled: dialogOpen,
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<NewOrderForm>({
    resolver: zodResolver(newOrderSchema),
    defaultValues: { customer_mode: 'existing', priority: 'normal' },
  })

  const customerMode = watch('customer_mode')

  const onSubmit = async (data: NewOrderForm) => {
    if (!activeBranchId || !activeCompanyId) {
      toast.error('No tenés sucursal asignada. Contactá al administrador.')
      return
    }
    setIsSaving(true)
    try {
      let customer_id = data.customer_id!

      if (data.customer_mode === 'new') {
        const newCustomer = await customerService.create({
          company_id: activeCompanyId,
          full_name: data.customer_full_name!,
          email: data.customer_email || undefined,
          phone: data.customer_phone || undefined,
        })
        customer_id = newCustomer.id
      }

      const device = await deviceService.create({
        customer_id,
        brand: data.brand,
        model: data.model,
        device_type: data.device_type,
        imei: data.imei || undefined,
        serial_number: data.serial_number || undefined,
      })

      await workOrderService.create({
        branch_id: activeBranchId,
        customer_id,
        device_id: device.id,
        problem_description: data.problem_description,
        priority: data.priority,
        estimated_cost: data.estimated_cost ? Number(data.estimated_cost) : undefined,
      })

      await queryClient.invalidateQueries({ queryKey: ['work-orders'] })
      toast.success('Orden creada correctamente')
      reset()
      setDialogOpen(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(msg || 'Error al crear la orden')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Órdenes de trabajo</h1>
          <p className="text-sm text-gray-500 mt-1">{orders.length} órdenes encontradas</p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          Nueva orden
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ClipboardList className="w-10 h-10 mb-3" />
            <p className="text-sm font-medium">No hay órdenes para mostrar</p>
            <p className="text-xs mt-1">Cambiá el filtro o creá una nueva orden</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">N° Orden</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prioridad</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha recepción</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Costo final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/app/work-orders/${order.id}`)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-3 font-mono text-blue-600 font-medium">{order.order_number}</td>
                    <td className="px-6 py-3">
                      <Badge className={`${STATUS_COLORS[order.status]} border-0 font-medium`}>
                        {STATUS_LABELS[order.status]}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-gray-600 capitalize">{order.priority}</td>
                    <td className="px-6 py-3 text-gray-500">
                      {new Date(order.received_at).toLocaleDateString('es-AR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {order.final_cost != null
                        ? `$${order.final_cost.toLocaleString('es-AR')}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Nueva orden dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) reset() }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva orden de trabajo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-2">

            {/* — CLIENTE — */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 border-b pb-1">Cliente</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={customerMode === 'existing' ? 'default' : 'outline'}
                  onClick={() => setValue('customer_mode', 'existing')}
                >
                  Existente
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={customerMode === 'new' ? 'default' : 'outline'}
                  onClick={() => setValue('customer_mode', 'new')}
                >
                  Nuevo
                </Button>
              </div>

              {customerMode === 'existing' ? (
                <div className="space-y-1.5">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Buscar cliente..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    size={Math.min(customers.length || 1, 5)}
                    onChange={(e) => setValue('customer_id', e.target.value)}
                  >
                    {customers.length === 0 && (
                      <option disabled value="">Sin resultados</option>
                    )}
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name}{c.phone ? ` · ${c.phone}` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.customer_id && (
                    <p className="text-xs text-red-500">{errors.customer_id.message}</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1">
                    <Label>Nombre *</Label>
                    <Input placeholder="Juan Pérez" {...register('customer_full_name')} />
                    {errors.customer_full_name && (
                      <p className="text-xs text-red-500">{errors.customer_full_name.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input type="email" placeholder="juan@mail.com" {...register('customer_email')} />
                  </div>
                  <div className="space-y-1">
                    <Label>Teléfono</Label>
                    <Input placeholder="+54 9 11..." {...register('customer_phone')} />
                  </div>
                </div>
              )}
            </div>

            {/* — DISPOSITIVO — */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 border-b pb-1">Dispositivo</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Tipo *</Label>
                  <Select onValueChange={(v) => setValue('device_type', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEVICE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{DEVICE_TYPE_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.device_type && (
                    <p className="text-xs text-red-500">{errors.device_type.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Marca *</Label>
                  <Input placeholder="Samsung" {...register('brand')} />
                  {errors.brand && (
                    <p className="text-xs text-red-500">{errors.brand.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Modelo *</Label>
                  <Input placeholder="Galaxy S23" {...register('model')} />
                  {errors.model && (
                    <p className="text-xs text-red-500">{errors.model.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>IMEI / Serie</Label>
                  <Input placeholder="Opcional" {...register('imei')} />
                </div>
              </div>
            </div>

            {/* — ORDEN — */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 border-b pb-1">Detalles de la orden</p>
              <div className="space-y-1">
                <Label>Problema reportado *</Label>
                <textarea
                  rows={3}
                  placeholder="Describí el problema que trae el equipo..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  {...register('problem_description')}
                />
                {errors.problem_description && (
                  <p className="text-xs text-red-500">{errors.problem_description.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Prioridad</Label>
                  <Select defaultValue="normal" onValueChange={(v) => setValue('priority', v as NewOrderForm['priority'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Costo estimado</Label>
                  <Input type="number" placeholder="0.00" {...register('estimated_cost')} />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); reset() }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Crear orden
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
