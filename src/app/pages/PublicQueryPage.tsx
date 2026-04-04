import { useState, useEffect } from 'react'
import { Search, Wrench, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent } from '@/shared/components/ui/card'
import api from '@/app/services/api'
import { WorkOrderStatus } from '@/app/services/workOrderService'
import { STATUS_LABELS, STATUS_COLORS } from './DashboardPage'

interface PublicOrderResult {
  order_number: string
  status: WorkOrderStatus
  device_brand?: string
  device_model?: string
  branch_name?: string
  received_at: string
  status_display: string
}

export function PublicQueryPage() {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<PublicOrderResult | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const orden = params.get('orden')
    if (token) {
      searchByToken(token)
    } else if (orden) {
      setQuery(orden)
      searchByOrderNumber(orden)
    }
  }, [])

  const searchByToken = async (token: string) => {
    setIsLoading(true)
    setResult(null)
    setNotFound(false)
    try {
      const { data } = await api.get<PublicOrderResult>(`/api/public/token/${token}`)
      setResult(data)
    } catch {
      setNotFound(true)
    } finally {
      setIsLoading(false)
    }
  }

  const searchByOrderNumber = async (orderNumber: string) => {
    setIsLoading(true)
    setResult(null)
    setNotFound(false)
    try {
      const { data } = await api.get<PublicOrderResult>(`/api/public/order/${orderNumber}`)
      setResult(data)
    } catch {
      setNotFound(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    if (!query.trim()) return
    searchByOrderNumber(query.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Servicio Técnico</p>
            <p className="text-xs text-gray-500">Consulta de órdenes</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center pt-20 px-4">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Consultar estado de mi equipo</h1>
            <p className="text-sm text-gray-500 mt-2">
              Ingresá el número de orden para ver el estado actualizado de tu reparación.
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Ej: WO-2026-FAB6-000001"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="font-mono"
            />
            <Button onClick={handleSearch} disabled={isLoading || !query.trim()} className="gap-2 px-5">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Buscar
            </Button>
          </div>

          {result && (
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 space-y-5">
                <div className="text-center space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Estado actual</p>
                  <Badge className={`${STATUS_COLORS[result.status]} border-0 text-base font-semibold px-4 py-1.5`}>
                    {result.status_display || STATUS_LABELS[result.status]}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">N° Orden</p>
                    <p className="text-sm font-mono font-medium text-gray-900">{result.order_number}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Fecha recepción</p>
                    <p className="text-sm text-gray-700">
                      {new Date(result.received_at).toLocaleDateString('es-AR', {
                        day: '2-digit', month: 'long', year: 'numeric',
                      })}
                    </p>
                  </div>
                  {result.device_brand && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Dispositivo</p>
                      <p className="text-sm text-gray-700">{result.device_brand} {result.device_model}</p>
                    </div>
                  )}
                  {result.branch_name && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Sucursal</p>
                      <p className="text-sm text-gray-700">{result.branch_name}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {notFound && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-700">Orden no encontrada</p>
                <p className="text-xs text-red-500 mt-0.5">
                  Verificá el número ingresado o consultá con el taller.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
