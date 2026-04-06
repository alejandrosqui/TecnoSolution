import api from './api'

export interface Product {
  id: string
  branch_id: string
  name: string
  sku: string | null
  brand: string | null
  category: string | null
  unit_cost: number | null
  sale_price: number | null
  stock_quantity: number
  is_active: boolean
}

export interface ProductCreate {
  branch_id: string
  name: string
  sku?: string
  brand?: string
  category?: string
  unit_cost?: number
  sale_price?: number
  min_stock_alert?: number
}

export interface StockMovementCreate {
  movement_type: 'entrada' | 'salida' | 'ajuste'
  quantity: number
  unit_cost?: number
  reference?: string
  work_order_id?: string
}

export const stockService = {
list: (branch_id?: string): Promise<Product[]> => {
    const params = branch_id ? `?branch_id=${branch_id}` : ''
    return api.get(`/api/products/${params}`).then(r => r.data)
  },
  create: (data: ProductCreate): Promise<Product> =>
    api.post('/api/products/', data).then(r => r.data),
  addMovement: (product_id: string, data: StockMovementCreate) =>
    api.post(`/api/products/${product_id}/movements`, data).then(r => r.data),
}
