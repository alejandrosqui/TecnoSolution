import api from './api'

export type WorkOrderStatus = 'received' | 'queued' | 'diagnosing' | 'waiting_customer_approval' | 'quote_sent' | 'approved' | 'rejected' | 'waiting_parts' | 'repairing' | 'repaired' | 'ready_for_pickup' | 'delivered' | 'warranty' | 'cancelled'

export interface WorkOrder {
  id: string; order_number: string; status: WorkOrderStatus; priority: string
  customer_id: string; device_id: string; branch_id: string; assigned_to: string | null
  problem_description: string; diagnosis_notes: string | null; final_cost: number | null
  received_at: string; created_at: string
}

export interface WorkOrderCreate {
  customer_id: string; device_id: string; branch_id: string
  problem_description: string; priority?: string; estimated_cost?: number
}

export const workOrderService = {
  list: async (params?: { branch_id?: string; status?: string }) => {
    const { data } = await api.get<WorkOrder[]>('/api/work-orders', { params })
    return data
  },
  get: async (id: string) => {
    const { data } = await api.get<WorkOrder>(`/api/work-orders/${id}`)
    return data
  },
  create: async (payload: WorkOrderCreate) => {
    const { data } = await api.post<WorkOrder>('/api/work-orders', payload)
    return data
  },
  updateStatus: async (id: string, payload: { status: WorkOrderStatus; comment?: string }) => {
    const { data } = await api.patch(`/api/work-orders/${id}/status`, payload)
    return data
  },
  history: async (id: string) => {
    const { data } = await api.get(`/api/work-orders/${id}/history`)
    return data
  },
}
