import api from './api'

export interface WarrantyClaim {
  id: string
  description: string
  status: string
  resolved_at: string | null
  resolution_notes: string | null
  created_at: string
}

export interface Warranty {
  id: string
  work_order_id: string
  warranty_months: number
  starts_at: string
  expires_at: string
  terms: string | null
  is_active: boolean
  claims: WarrantyClaim[]
  order_number: string | null
  customer_name: string | null
  device_name: string | null
}

export interface WarrantyCreate {
  work_order_id: string
  warranty_months: number
  starts_at: string
  terms?: string
}

export const warrantyService = {
  list: (): Promise<Warranty[]> =>
    api.get('/api/warranties/').then(r => r.data),
  create: (data: WarrantyCreate): Promise<Warranty> =>
    api.post('/api/warranties/', data).then(r => r.data),
  addClaim: (warranty_id: string, description: string) =>
    api.post(`/api/warranties/${warranty_id}/claims`, { description }).then(r => r.data),
}
