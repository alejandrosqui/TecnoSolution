import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, BookOpen } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { DeviceDocuments } from '@/app/components/DeviceDocuments'
import api from '@/app/services/api'

export function DocumentsLibraryPage() {
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [search, setSearch] = useState<{brand: string, model: string} | null>(null)

  const handleSearch = () => {
    if (!brand.trim() || !model.trim()) return
    setSearch({ brand: brand.trim(), model: model.trim() })
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Biblioteca de documentación</h1>
        <p className="text-sm text-gray-500 mt-1">Buscá manuales, esquemas y calibraciones por dispositivo</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Marca</label>
            <Input
              placeholder="Ej: Samsung, Apple, Lenovo..."
              value={brand}
              onChange={e => setBrand(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Modelo</label>
            <Input
              placeholder="Ej: Galaxy S23, iPhone 14..."
              value={model}
              onChange={e => setModel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSearch} disabled={!brand.trim() || !model.trim()} className="gap-2 w-full">
              <Search className="w-4 h-4" />
              Buscar documentación
            </Button>
          </div>
        </div>
      </div>

      {search ? (
        <DeviceDocuments brand={search.brand} model={search.model} />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <BookOpen className="w-12 h-12 mb-3 opacity-50" />
          <p className="text-sm font-medium">Ingresá la marca y modelo para buscar</p>
          <p className="text-xs mt-1">La documentación es compartida entre todos los técnicos de tu empresa</p>
        </div>
      )}
    </div>
  )
}
