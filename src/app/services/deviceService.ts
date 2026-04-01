import api from './api'

export interface Device {
  id: string
  customer_id: string
  brand: string
  model: string
  device_type: string
  imei: string | null
  serial_number: string | null
  created_at: string
}

export interface DeviceCreate {
  customer_id: string
  brand: string
  model: string
  device_type: string
  imei?: string
  serial_number?: string
  color?: string
  condition_on_receipt?: string
}

export const deviceService = {
  create: async (payload: DeviceCreate): Promise<Device> => {
    const { data } = await api.post<Device>('/api/devices', payload)
    return data
  },
  listByCustomer: async (customer_id: string): Promise<Device[]> => {
    const { data } = await api.get<Device[]>(`/api/devices/customer/${customer_id}`)
    return data
  },
}
