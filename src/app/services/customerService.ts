import api from './api'

export interface Customer {
  id: string; company_id: string; full_name: string
  email: string | null; phone: string | null; address: string | null; created_at: string
}
export interface CustomerCreate {
  company_id: string; full_name: string; email?: string; phone?: string; address?: string; notes?: string
}

export const customerService = {
  list: async (search?: string) => {
    const { data } = await api.get<Customer[]>('/api/customers', { params: search ? { search } : undefined })
    return data
  },
  get: async (id: string) => {
    const { data } = await api.get<Customer>(`/api/customers/${id}`)
    return data
  },
  create: async (payload: CustomerCreate) => {
    const { data } = await api.post<Customer>('/api/customers', payload)
    return data
  },
}
