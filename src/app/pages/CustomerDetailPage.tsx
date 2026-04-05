import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Loader2, User, Phone, Mail, MapPin } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import api from '@/app/services/api'
import { STATUS_LABELS, STATUS_COLORS } from './DashboardPage'
import { WorkOrderStatus } from '@/app/services/workOrderService'

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Estados para modales
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({ full_name: '', email: '', phone: '', address: '' })

  // Query: Obtener datos del cliente
  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/customers/${id}`)
      return data
    },
    enabled: !!id,
  })

  // Query: Obtener órdenes del cliente
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['customer-orders', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/customers/${id}/orders`)
      return data as {
        id: string
        order_number: string
        status: WorkOrderStatus
        priority: string
        problem_description: string
        received_at: string
        device_brand: string
        device_model: string
        device_type: string
      }[]
    },
    enabled: !!id,
  })

  // Abrir modal de edición con datos actuales
  const handleEditOpen = () => {
    setEditForm({
      full_name: customer.full_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
    })
    setEditOpen(true)
  }

  // Guardar cambios del cliente
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await api.patch(`/api/customers/${id}`, {
        company_id: customer.company_id,
        ...editForm,
      })
      await queryClient.invalidateQueries({ queryKey: ['customer', id] })
      await queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Cliente actualizado')
      setEditOpen(false)
    } catch {
      toast.error('Error al actualizar')
    } finally {
      setIsSaving(false)
    }
  }

  // Eliminar cliente
  const handleDelete = async () => {
    try {
      await api.delete(`/api/customers/${id}`)
      await queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Cliente eliminado')
      navigate('/app/customers')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  if (customerLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  )

  if (!customer) return (
    <div className="p-6"><p className="text-gray-500">Cliente no encontrado.</p></div>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header con botones de editar/eliminar */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mt-0.5">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver
        </Button>
        <div className="flex-1">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{customer.full_name}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Cliente desde {new Date(customer.created_at).toLocaleDateString('es-AR', {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleEditOpen} className="gap-2">
                <Pencil className="w-4 h-4" />
                Editar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setDeleteOpen(true)} 
                className="gap-2 text-red-600 hover:text-red-700 border-red-200"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Datos del cliente */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Datos de contacto</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-800 font-medium">{customer.full_name}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600">{customer.email}</span>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600">{customer.phone}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600">{customer.address}</span>
              </div>
            )}
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-400">Total de órdenes</p>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            </div>
          </CardContent>
        </Card>

        {/* Órdenes del cliente */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">Historial de órdenes</CardTitle></CardHeader>
            <CardContent className="p-0">
              {ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Sin órdenes registradas</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">N° Orden</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Dispositivo</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Problema</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map(order => (
                      <tr key={order.id}
                        onClick={() => navigate(`/app/work-orders/${order.id}`)}
                        className="hover:bg-blue-50 cursor-pointer transition-colors">
                        <td className="px-4 py-3 font-mono text-blue-600 font-medium whitespace-nowrap">
                          {order.order_number}
                        </td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                          {order.device_brand} {order.device_model}
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs">
                          <p className="truncate">{order.problem_description}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`${STATUS_COLORS[order.status]} border-0 font-medium whitespace-nowrap`}>
                            {STATUS_LABELS[order.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                          {new Date(order.received_at).toLocaleDateString('es-AR', {
                            day: '2-digit', month: '2-digit', year: 'numeric'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ============================================ */}
      {/* MODAL EDITAR CLIENTE */}
      {/* ============================================ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre completo</Label>
              <Input 
                value={editForm.full_name} 
                onChange={e => setEditForm(f => ({...f, full_name: e.target.value}))} 
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input 
                value={editForm.email} 
                onChange={e => setEditForm(f => ({...f, email: e.target.value}))} 
              />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input 
                value={editForm.phone} 
                onChange={e => setEditForm(f => ({...f, phone: e.target.value}))} 
              />
            </div>
            <div className="space-y-1.5">
              <Label>Dirección</Label>
              <Input 
                value={editForm.address} 
                onChange={e => setEditForm(f => ({...f, address: e.target.value}))} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      {/* ============================================ */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar cliente</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            ¿Estás seguro que querés eliminar a <strong>{customer.full_name}</strong>? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
