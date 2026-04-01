import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react'
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
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { workOrderService, WorkOrderStatus } from '@/app/services/workOrderService'
import { STATUS_LABELS, STATUS_COLORS } from './DashboardPage'

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

export function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<WorkOrderStatus | ''>('')
  const [statusComment, setStatusComment] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

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

  const handleUpdateStatus = async () => {
    if (!newStatus || !id) return
    setIsUpdating(true)
    try {
      await workOrderService.updateStatus(id, {
        status: newStatus as WorkOrderStatus,
        comment: statusComment || undefined,
      })
      await queryClient.invalidateQueries({ queryKey: ['work-order', id] })
      await queryClient.invalidateQueries({ queryKey: ['work-order-history', id] })
      setDialogOpen(false)
      setNewStatus('')
      setStatusComment('')
    } catch {
      // handle error silently for now
    } finally {
      setIsUpdating(false)
    }
  }

  if (orderLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Orden no encontrada.</p>
      </div>
    )
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
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Cambiar estado
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order info */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Información de la orden</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Descripción del problema
              </p>
              <p className="text-sm text-gray-800">{order.problem_description || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Notas de diagnóstico
              </p>
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

      {/* Change status dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateStatus} disabled={!newStatus || isUpdating}>
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
