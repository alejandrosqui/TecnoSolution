import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, RefreshCw, FileText, Plus, Trash2, Camera, Printer } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { workOrderService, WorkOrderStatus } from '@/app/services/workOrderService'
import { STATUS_LABELS, STATUS_COLORS } from './DashboardPage'
import api from '@/app/services/api'
import { toast } from 'sonner'
import { PrintTicket } from '@/app/components/PrintTicket'

const ALL_STATUSES: WorkOrderStatus[] = [
  'received', 'queued', 'diagnosing', 'waiting_customer_approval', 'quote_sent',
  'approved', 'rejected', 'waiting_parts', 'repairing', 'repaired',
  'ready_for_pickup', 'delivered', 'warranty', 'cancelled',
]

interface HistoryItem {
  id: string
  from_status: WorkOrderStatus | null
  to_status: WorkOrderStatus
  changed_by_name?: string
  comment?: string
  created_at: string
}

interface QuoteItem {
  description: string
  quantity: string
  unit_price: string
  item_type: 'service' | 'part'
}

const emptyItem = (): QuoteItem => ({ description: '', quantity: '1', unit_price: '', item_type: 'service' })

export function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<WorkOrderStatus | ''>('')
  const [statusComment, setStatusComment] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  
  // 👇 NUEVO: Estado para las horas estimadas
  const [estimatedHours, setEstimatedHours] = useState<string>('')

  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false)
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([emptyItem()])
  const [taxRate, setTaxRate] = useState('0')
  const [quoteNotes, setQuoteNotes] = useState('')
  const [isSavingQuote, setIsSavingQuote] = useState(false)
  const [photos, setPhotos] = useState<{id: string, filename: string, url: string}[]>([])
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false)
  const [showPrintTicket, setShowPrintTicket] = useState(false)

  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ['work-order', id],
    queryFn: () => workOrderService.get(id!),
    enabled: !!id,
  })

  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ['work-order-history', id],
    queryFn: () => workOrderService.history(id!),
    enabled: !!id,
  })

  const { data: quotes = [] } = useQuery({
    queryKey: ['work-order-quotes', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/work-orders/${id}/quotes`)
      return data as { id: string; quote_number: string; status: string; total: number; created_at: string }[]
    },
    enabled: !!id,
  })
const { data: customer } = useQuery({
  queryKey: ['customer', order?.customer_id],
  queryFn: async () => {
    const { data } = await api.get(`/api/customers/${order!.customer_id}`)
    return data
  },
  enabled: !!order?.customer_id,
})

const { data: device } = useQuery({
  queryKey: ['device', order?.device_id],
  queryFn: async () => {
    const { data } = await api.get(`/api/devices/${order!.device_id}`)
    return data
  },
  enabled: !!order?.device_id,
})

const { data: companySettings } = useQuery({
  queryKey: ['my-settings'],
  queryFn: async () => {
    const { data } = await api.get('/api/companies/my/settings')
    return data
  },
})
  const { data: photosData, refetch: refetchPhotos } = useQuery({
    queryKey: ['work-order-photos', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/storage/work-orders/${id}/photos`)
      return data as { photos: {id: string, filename: string, url: string}[] }
    },
    enabled: !!id,
  })

  // 👇 MODIFICADO: Función para actualizar estado con estimated_hours
  const handleUpdateStatus = async () => {
    if (!newStatus || !id) return
    setIsUpdating(true)
    try {
      await workOrderService.updateStatus(id, {
        status: newStatus as WorkOrderStatus,
        comment: statusComment || undefined,
        estimated_hours: estimatedHours ? Number(estimatedHours) : undefined, // 👈 NUEVO: enviar horas estimadas
      })
      await queryClient.invalidateQueries({ queryKey: ['work-order', id] })
      await queryClient.invalidateQueries({ queryKey: ['work-order-history', id] })
      setStatusDialogOpen(false)
      setNewStatus('')
      setStatusComment('')
      setEstimatedHours('') // 👈 NUEVO: limpiar horas estimadas
      toast.success('Estado actualizado')
    } catch {
      toast.error('Error al actualizar el estado')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCreateQuote = async () => {
    if (!id) return
    const validItems = quoteItems.filter((i) => i.description && i.unit_price)
    if (validItems.length === 0) {
      toast.error('Agregá al menos un ítem con descripción y precio')
      return
    }
    setIsSavingQuote(true)
    try {
      await api.post(`/api/work-orders/${id}/quotes`, {
        items: validItems.map((i) => ({
          description: i.description,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
          item_type: i.item_type,
        })),
        tax_rate: Number(taxRate),
        notes: quoteNotes || undefined,
      })
      await queryClient.invalidateQueries({ queryKey: ['work-order-quotes', id] })
      toast.success('Presupuesto creado')
      setQuoteDialogOpen(false)
      setQuoteItems([emptyItem()])
      setTaxRate('0')
      setQuoteNotes('')
    } catch {
      toast.error('Error al crear el presupuesto')
    } finally {
      setIsSavingQuote(false)
    }
  }
  const handleUploadPhotos = async (files: FileList) => {
    if (!id) return
    if (files.length > 5) {
      toast.error('Máximo 5 fotos')
      return
    }
    setIsUploadingPhotos(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach(f => formData.append('files', f))
      await api.post(`/api/storage/work-orders/${id}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      await refetchPhotos()
      toast.success('Fotos subidas correctamente')
    } catch {
      toast.error('Error al subir fotos')
    } finally {
      setIsUploadingPhotos(false)
    }
  }

  const updateItem = (idx: number, field: keyof QuoteItem, value: string) => {
    setQuoteItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const subtotal = quoteItems.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0)
  const tax = subtotal * (Number(taxRate) || 0) / 100
  const total = subtotal + tax

  if (orderLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!order) {
    return <div className="p-6"><p className="text-gray-500">Orden no encontrada.</p></div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mt-0.5">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-mono text-gray-900">{order.order_number}</h1>
            <Badge className={`${STATUS_COLORS[order.status]} border-0 font-medium text-sm`}>
              {STATUS_LABELS[order.status]}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Recibida el{' '}
            {new Date(order.received_at).toLocaleDateString('es-AR', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setQuoteDialogOpen(true)} className="gap-2">
            <FileText className="w-4 h-4" />
            Presupuesto
          </Button>
         <Button variant="outline" onClick={() => { setShowPrintTicket(true); setTimeout(() => window.print(), 300) }} className="gap-2">
           <Printer className="w-4 h-4" />
           Imprimir ticket
         </Button>
          <Button onClick={() => setStatusDialogOpen(true)} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Cambiar estado
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order info */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Información de la orden</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Descripción del problema</p>
              <p className="text-sm text-gray-800">{order.problem_description || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notas de diagnóstico</p>
              <p className="text-sm text-gray-800">{order.diagnosis_notes || '—'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Prioridad</p>
                <p className="text-sm text-gray-800 capitalize">{order.priority}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Costo final</p>
                <p className="text-sm text-gray-800">
                  {order.final_cost != null ? `$${order.final_cost.toLocaleString('es-AR')}` : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History timeline */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Historial de estados</CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : (history as HistoryItem[]).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Sin historial registrado</p>
            ) : (
              <ol className="relative border-l border-gray-200 space-y-6 ml-2">
                {(history as HistoryItem[]).map((item) => (
                  <li key={item.id} className="ml-4">
                    <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.from_status && (
                          <>
                            <Badge className={`${STATUS_COLORS[item.from_status]} border-0 text-xs`}>
                              {STATUS_LABELS[item.from_status]}
                            </Badge>
                            <span className="text-gray-400 text-xs">→</span>
                          </>
                        )}
                        <Badge className={`${STATUS_COLORS[item.to_status]} border-0 text-xs`}>
                          {STATUS_LABELS[item.to_status]}
                        </Badge>
                      </div>
                      {item.comment && (
                        <p className="text-xs text-gray-600 italic">"{item.comment}"</p>
                      )}
                      <p className="text-xs text-gray-400">
                        {item.changed_by_name && <span>{item.changed_by_name} · </span>}
                        {new Date(item.created_at).toLocaleString('es-AR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quotes list */}
      {quotes.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Presupuestos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">N° Presupuesto</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-blue-600">{q.quote_number}</td>
                    <td className="px-6 py-3 text-gray-600 capitalize">{q.status}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">${Number(q.total).toLocaleString('es-AR')}</td>
                    <td className="px-6 py-3 text-gray-500">
                      {new Date(q.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
{/* Photos */}
  <Card className="border-0 shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className="text-base">Fotos del equipo</CardTitle>
      <label className="cursor-pointer">
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleUploadPhotos(e.target.files)}
        />
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <span>
            {isUploadingPhotos ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            Subir fotos
          </span>
        </Button>
      </label>
    </CardHeader>
    <CardContent>
      {photosData?.photos?.length === 0 || !photosData?.photos ? (
        <p className="text-sm text-gray-400 text-center py-6">Sin fotos cargadas</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {photosData.photos.map((photo) => (
            <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer">
              <img
                src={photo.url}
                alt={photo.filename}
                className="w-full h-24 object-cover rounded-lg border hover:opacity-80 transition-opacity"
              />
            </a>
            ))}
        </div>
      )}
    </CardContent>
  </Card>
{showPrintTicket && (
  <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
    <PrintTicket
      order={order}
      customer={customer}
      device={device}
      companySettings={companySettings}
    />
  </div>
)}

{/* Change status dialog */}

      {/* ============================================ */}
      {/* DIALOG DE CAMBIO DE ESTADO (MODIFICADO) */}
      {/* ============================================ */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar estado de la orden</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nuevo estado</Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as WorkOrderStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="status-comment">Comentario (opcional)</Label>
              <textarea
                id="status-comment"
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                rows={3}
                placeholder="Agregar un comentario..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </div>

            {/* 👇 NUEVO: Selector de horas estimadas (solo para ciertos estados) */}
            {['diagnosing', 'waiting_parts', 'repairing', 'ready_for_pickup'].includes(newStatus) && (
              <div className="space-y-1.5">
                <Label htmlFor="estimated-hours">Tiempo estimado para el próximo paso</Label>
                <Select onValueChange={setEstimatedHours} value={estimatedHours}>
                  <SelectTrigger>
                    <SelectValue placeholder="Usar tiempo por defecto de Settings" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 horas</SelectItem>
                    <SelectItem value="4">4 horas</SelectItem>
                    <SelectItem value="8">8 horas (1 día)</SelectItem>
                    <SelectItem value="24">24 horas</SelectItem>
                    <SelectItem value="48">48 horas (2 días)</SelectItem>
                    <SelectItem value="72">72 horas (3 días)</SelectItem>
                    <SelectItem value="120">5 días</SelectItem>
                    <SelectItem value="168">7 días</SelectItem>
                    <SelectItem value="240">10 días</SelectItem>
                    <SelectItem value="336">14 días</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400">
                  Si no seleccionás, usa el tiempo configurado en Settings
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateStatus} disabled={!newStatus || isUpdating}>
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create quote dialog */}
      <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo presupuesto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Items */}
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase px-1">
                <span className="col-span-5">Descripción</span>
                <span className="col-span-2">Cant.</span>
                <span className="col-span-2">Precio</span>
                <span className="col-span-2">Tipo</span>
                <span className="col-span-1"></span>
              </div>
              {quoteItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <Input
                    className="col-span-5 text-sm"
                    placeholder="Cambio de pantalla..."
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                  />
                  <Input
                    className="col-span-2 text-sm"
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                  />
                  <Input
                    className="col-span-2 text-sm"
                    type="number"
                    placeholder="0"
                    value={item.unit_price}
                    onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                  />
                  <Select
                    value={item.item_type}
                    onValueChange={(v) => updateItem(idx, 'item_type', v)}
                  >
                    <SelectTrigger className="col-span-2 text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service">Servicio</SelectItem>
                      <SelectItem value="part">Repuesto</SelectItem>
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    className="col-span-1 flex justify-center text-gray-400 hover:text-red-500"
                    onClick={() => setQuoteItems((prev) => prev.filter((_, i) => i !== idx))}
                    disabled={quoteItems.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setQuoteItems((prev) => [...prev, emptyItem()])}
              >
                <Plus className="w-3 h-3" />
                Agregar ítem
              </Button>
            </div>

            {/* Totals */}
            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 flex-1">IVA (%)</span>
                <Input
                  type="number"
                  className="w-20 text-sm text-right h-7"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                />
                <span className="text-gray-500 w-20 text-right">${tax.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between font-semibold text-base border-t pt-2">
                <span>Total</span>
                <span>${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notas</Label>
              <textarea
                rows={2}
                placeholder="Observaciones opcionales..."
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuoteDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateQuote} disabled={isSavingQuote}>
              {isSavingQuote && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar presupuesto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}