import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, ClipboardList, Search, Filter } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { workOrderService, WorkOrderStatus, WorkOrder } from '@/app/services/workOrderService'
import { customerService } from '@/app/services/customerService'
import { deviceService } from '@/app/services/deviceService'
import { useAuthStore } from '@/app/store/authStore'
import { STATUS_LABELS, STATUS_COLORS } from './DashboardPage'
import { toast } from 'sonner'
// 👇 NUEVO IMPORT
import api from '@/app/services/api'

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

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baja', normal: 'Normal', high: 'Alta', urgent: 'Urgente'
}

const ALERT_COLORS = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  red: 'bg-red-500',
}

const ALERT_ROW_COLORS = {
  green: '',
  yellow: 'bg-yellow-50',
  red: 'bg-red-50',
}

function getElapsedLabel(receivedAt: string): string {
  const hours = Math.floor((Date.now() - new Date(receivedAt).getTime()) / 3600000)
  if (hours < 1) return 'Hace menos de 1h'
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `Hace ${days}d`
}

const newOrderSchema = z.object({
  customer_mode: z.enum(['existing', 'new']),
  customer_id: z.string().optional(),
  customer_full_name: z.string().optional(),
  customer_email: z.string().optional(),
  customer_phone: z.string().optional(),
  brand: z.string().min(1, 'Marca requerida'),
  model: z.string().min(1, 'Modelo requerido'),
  device_type: z.string().min(1, 'Tipo requerido'),
  imei: z.string().optional(),
  serial_number: z.string().optional(),
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

// 👇 NUEVA FUNCIÓN: calcula el nivel de alerta según settings
function getAlertLevel(order: WorkOrder, settings?: any): 'green' | 'yellow' | 'red' {
  const finalStatuses = ['delivered', 'cancelled', 'warranty']
  if (finalStatuses.includes(order.status)) return 'green'

  const defaultHours = {
    received: settings?.default_diagnosis_hours || 48,
    diagnosing: settings?.default_diagnosis_hours || 48,
    repairing: settings?.default_repair_hours || 48,
    waiting_parts: (settings?.default_waiting_days || 7) * 24,
    ready_for_pickup: (settings?.default_pickup_days || 10) * 24,
  }

  const deadline = (order as any).deadline_at
  if (deadline) {
    const now = Date.now()
    const deadlineTime = new Date(deadline).getTime()
    const totalTime = deadlineTime - new Date(order.received_at).getTime()
    const elapsed = now - new Date(order.received_at).getTime()
    const pct = elapsed / totalTime
    if (now > deadlineTime) return 'red'
    if (pct > 0.8) return 'yellow'
    return 'green'
  }

  const maxHours = defaultHours[order.status as keyof typeof defaultHours] || 48
  const hours = (Date.now() - new Date(order.received_at).getTime()) / 3600000
  if (hours > maxHours) return 'red'
  if (hours > maxHours * 0.8) return 'yellow'
  return 'green'
}

export function WorkOrdersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeBranchId, activeCompanyId } = useAuthStore()

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchText, setSearchText] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('all')
  const [alertFilter, setAlertFilter] = useState('all')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // ============================================
  // 🔍 QUERY 1: Órdenes de trabajo (YA EXISTENTE)
  // ============================================
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['work-orders'],
    queryFn: () => workOrderService.list(),
  })

  // ============================================
  // 🔍 QUERY 2: Clientes (YA EXISTENTE)
  // ============================================
  const { data: customers = [] } = useQuery({
    queryKey: ['customers', customerSearch],
    queryFn: () => customerService.list(customerSearch || undefined),
    enabled: dialogOpen,
  })
  const { data: companySettings } = useQuery({
      queryKey: ['my-settings'],
      queryFn: async () => {
        const { data } = await api.get('/api/companies/my/settings')
        return data
      },
    })

  // Filtrado local
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const alert = getAlertLevel(order, companySettings)
      const orderAny = order as any

      if (statusFilter !== 'all' && order.status !== statusFilter) return false
      if (alertFilter !== 'all' && alert !== alertFilter) return false
      if (deviceTypeFilter !== 'all' && orderAny.device_type !== deviceTypeFilter) return false
      if (brandFilter && !orderAny.device_brand?.toLowerCase().includes(brandFilter.toLowerCase())) return false
      if (searchText) {
        const q = searchText.toLowerCase()
        const matchCustomer = orderAny.customer_name?.toLowerCase().includes(q)
        const matchOrder = order.order_number.toLowerCase().includes(q)
        const matchBrand = orderAny.device_brand?.toLowerCase().includes(q)
        const matchModel = orderAny.device_model?.toLowerCase().includes(q)
        const matchProblem = order.problem_description?.toLowerCase().includes(q)
        if (!matchCustomer && !matchOrder && !matchBrand && !matchModel && !matchProblem) return false
      }
      return true
    })
  }, [orders, statusFilter, alertFilter, deviceTypeFilter, brandFilter, searchText, companySettings])

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<NewOrderForm>({
    resolver: zodResolver(newOrderSchema),
    defaultValues: { customer_mode: 'existing', priority: 'normal' },
  })

  const customerMode = watch('customer_mode')

  const onSubmit = async (data: NewOrderForm) => {
    if (!activeBranchId || !activeCompanyId) {
      toast.error('No tenés sucursal asignada.')
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

  // 👇 FILTRAR órdenes (si querés ocultar rojos, acá se aplica)
  // const filteredOrders = orders.filter(order => {
  //   const alert = getAlertLevel(order, companySettings)
  //   // Si tenés un toggle "ocultar rojos", agregá la condición
  //   // return ocultarRojos ? alert !== 'red' : true
  //   return true
  // })

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Órdenes de trabajo</h1>
          <p className="text-sm text-gray-500 mt-1">{filteredOrders.length} de {orders.length} órdenes</p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          Nueva orden
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <Filter className="w-4 h-4" />
          Filtros
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Búsqueda libre */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Cliente, orden, marca, problema..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          {/* Estado */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {ALL_STATUSES.map(s => (
                <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tipo de dispositivo */}
          <Select value={deviceTypeFilter} onValueChange={setDeviceTypeFilter}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Tipo dispositivo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {DEVICE_TYPES.map(t => (
                <SelectItem key={t} value={t}>{DEVICE_TYPE_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Alerta */}
          <Select value={alertFilter} onValueChange={setAlertFilter}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Alerta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las alertas</SelectItem>
              <SelectItem value="green">🟢 En tiempo</SelectItem>
              <SelectItem value="yellow">🟡 Por vencer</SelectItem>
              <SelectItem value="red">🔴 Vencidas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtro de marca (texto libre) */}
        <div className="flex gap-3 items-center">
          <Input
            placeholder="Filtrar por marca (ej: Samsung, Apple...)"
            value={brandFilter}
            onChange={e => setBrandFilter(e.target.value)}
            className="max-w-xs text-sm"
          />
          {(statusFilter !== 'all' || searchText || brandFilter || deviceTypeFilter !== 'all' || alertFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter('all')
                setSearchText('')
                setBrandFilter('')
                setDeviceTypeFilter('all')
                setAlertFilter('all')
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Leyenda de colores */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />En tiempo</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />Por vencer (&gt;80%)</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />Vencida</span>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ClipboardList className="w-10 h-10 mb-3" />
            <p className="text-sm font-medium">No hay órdenes para mostrar</p>
            <p className="text-xs mt-1">Cambiá los filtros o creá una nueva orden</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="w-6 px-3 py-3"></th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">N° Orden</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dispositivo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Problema</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prioridad</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Antigüedad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => {
                  const alert = getAlertLevel(order)
                  const orderAny = order as any
                  return (
                    <tr
                      key={order.id}
                      onClick={() => navigate(`/app/work-orders/${order.id}`)}
                      className={`hover:opacity-80 cursor-pointer transition-colors ${ALERT_ROW_COLORS[alert]}`}
                    >
                      <td className="px-3 py-3">
                        <span className={`block w-2.5 h-2.5 rounded-full ${ALERT_COLORS[alert]}`} />
                      </td>
                      <td className="px-4 py-3 font-mono text-blue-600 font-medium whitespace-nowrap">
                        {order.order_number}
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-medium">
                        {orderAny.customer_name || '—'}
                        {orderAny.customer_phone && (
                          <div className="text-xs text-gray-400">{orderAny.customer_phone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {orderAny.device_brand} {orderAny.device_model}
                        {orderAny.device_type && (
                          <div className="text-xs text-gray-400">{DEVICE_TYPE_LABELS[orderAny.device_type] || orderAny.device_type}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs">
                        <p className="truncate">{order.problem_description}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${STATUS_COLORS[order.status]} border-0 font-medium whitespace-nowrap`}>
                          {STATUS_LABELS[order.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize whitespace-nowrap">
                        {PRIORITY_LABELS[order.priority] || order.priority}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {getElapsedLabel(order.received_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
             </table>
          </div>
        )}
      </div>

      {/* Dialog nueva orden */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) reset() }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva orden de trabajo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-2">
            {/* CLIENTE */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 border-b pb-1">Cliente</p>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant={customerMode === 'existing' ? 'default' : 'outline'} onClick={() => setValue('customer_mode', 'existing')}>Existente</Button>
                <Button type="button" size="sm" variant={customerMode === 'new' ? 'default' : 'outline'} onClick={() => setValue('customer_mode', 'new')}>Nuevo</Button>
              </div>
              {customerMode === 'existing' ? (
                <div className="space-y-1.5">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <Input placeholder="Buscar cliente..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="pl-9" />
                  </div>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    size={Math.min(customers.length || 1, 5)}
                    onChange={(e) => setValue('customer_id', e.target.value)}
                  >
                    {customers.length === 0 && <option disabled value="">Sin resultados</option>}
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.full_name}{c.phone ? ` · ${c.phone}` : ''}</option>
                    ))}
                  </select>
                  {errors.customer_id && <p className="text-xs text-red-500">{errors.customer_id.message}</p>}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1">
                    <Label>Nombre *</Label>
                    <Input placeholder="Juan Pérez" {...register('customer_full_name')} />
                    {errors.customer_full_name && <p className="text-xs text-red-500">{errors.customer_full_name.message}</p>}
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

            {/* DISPOSITIVO */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 border-b pb-1">Dispositivo</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Tipo *</Label>
                  <Select onValueChange={(v) => setValue('device_type', v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {DEVICE_TYPES.map((t) => <SelectItem key={t} value={t}>{DEVICE_TYPE_LABELS[t]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.device_type && <p className="text-xs text-red-500">{errors.device_type.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Marca *</Label>
                  <Input placeholder="Samsung" {...register('brand')} />
                  {errors.brand && <p className="text-xs text-red-500">{errors.brand.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Modelo *</Label>
                  <Input placeholder="Galaxy S23" {...register('model')} />
                  {errors.model && <p className="text-xs text-red-500">{errors.model.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>IMEI / Serie</Label>
                  <Input placeholder="Opcional" {...register('imei')} />
                </div>
              </div>
            </div>

            {/* ORDEN */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 border-b pb-1">Detalles de la orden</p>
              <div className="space-y-1">
                <Label>Problema reportado *</Label>
                <textarea rows={3} placeholder="Describí el problema..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" {...register('problem_description')} />
                {errors.problem_description && <p className="text-xs text-red-500">{errors.problem_description.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Prioridad</Label>
                  <Select defaultValue="normal" onValueChange={(v) => setValue('priority', v as NewOrderForm['priority'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); reset() }}>Cancelar</Button>
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
