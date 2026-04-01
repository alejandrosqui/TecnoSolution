import { useQuery } from '@tanstack/react-query'
import { ClipboardList, Loader2, Clock, CheckCircle, PackageCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { workOrderService, WorkOrderStatus } from '@/app/services/workOrderService'

export const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  received: 'Recibida',
  queued: 'En cola',
  diagnosing: 'Diagnosticando',
  waiting_customer_approval: 'Esperando aprobación',
  quote_sent: 'Presupuesto enviado',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  waiting_parts: 'Esperando repuestos',
  repairing: 'En reparación',
  repaired: 'Reparada',
  ready_for_pickup: 'Lista para retirar',
  delivered: 'Entregada',
  warranty: 'En garantía',
  cancelled: 'Cancelada',
}

export const STATUS_COLORS: Record<WorkOrderStatus, string> = {
  received: 'bg-slate-100 text-slate-700',
  queued: 'bg-yellow-100 text-yellow-700',
  diagnosing: 'bg-blue-100 text-blue-700',
  waiting_customer_approval: 'bg-orange-100 text-orange-700',
  quote_sent: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  waiting_parts: 'bg-amber-100 text-amber-700',
  repairing: 'bg-cyan-100 text-cyan-700',
  repaired: 'bg-teal-100 text-teal-700',
  ready_for_pickup: 'bg-emerald-100 text-emerald-700',
  delivered: 'bg-gray-100 text-gray-700',
  warranty: 'bg-indigo-100 text-indigo-700',
  cancelled: 'bg-red-50 text-red-400',
}

const IN_PROGRESS_STATUSES: WorkOrderStatus[] = [
  'queued', 'diagnosing', 'waiting_customer_approval', 'quote_sent',
  'approved', 'waiting_parts', 'repairing', 'repaired',
]

export function DashboardPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['work-orders'],
    queryFn: () => workOrderService.list(),
  })

  const total = orders.length
  const inProgress = orders.filter((o) => IN_PROGRESS_STATUSES.includes(o.status)).length
  const readyForPickup = orders.filter((o) => o.status === 'ready_for_pickup').length
  const delivered = orders.filter((o) => o.status === 'delivered').length

  const latest = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)

  const statCards = [
    { label: 'Total órdenes', value: total, icon: ClipboardList, color: 'text-blue-600' },
    { label: 'En proceso', value: inProgress, icon: Clock, color: 'text-amber-600' },
    { label: 'Listas para retirar', value: readyForPickup, icon: PackageCheck, color: 'text-emerald-600' },
    { label: 'Entregadas', value: delivered, icon: CheckCircle, color: 'text-gray-500' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Resumen general del taller</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`${color} bg-gray-50 rounded-xl p-3`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? '—' : value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Last 10 orders table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Últimas órdenes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : latest.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">No hay órdenes registradas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">N° Orden</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prioridad</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {latest.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-mono text-blue-600 font-medium">{order.order_number}</td>
                      <td className="px-6 py-3">
                        <Badge className={`${STATUS_COLORS[order.status]} border-0 font-medium`}>
                          {STATUS_LABELS[order.status]}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-gray-600 capitalize">{order.priority}</td>
                      <td className="px-6 py-3 text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('es-AR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
