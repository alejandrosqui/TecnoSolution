import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Loader2, ClipboardList } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { workOrderService, WorkOrderStatus } from '@/app/services/workOrderService'
import { STATUS_LABELS, STATUS_COLORS } from './DashboardPage'

const ALL_STATUSES: WorkOrderStatus[] = [
  'received', 'queued', 'diagnosing', 'waiting_customer_approval', 'quote_sent',
  'approved', 'rejected', 'waiting_parts', 'repairing', 'repaired',
  'ready_for_pickup', 'delivered', 'warranty', 'cancelled',
]

export function WorkOrdersPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['work-orders', { status: statusFilter }],
    queryFn: () =>
      workOrderService.list(statusFilter !== 'all' ? { status: statusFilter } : undefined),
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Órdenes de trabajo</h1>
          <p className="text-sm text-gray-500 mt-1">{orders.length} órdenes encontradas</p>
        </div>
        <Button className="gap-2">
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
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
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
    </div>
  )
}
