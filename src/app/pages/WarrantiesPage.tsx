import { Shield } from 'lucide-react'

export function WarrantiesPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Garantías</h1>
        <p className="text-sm text-gray-500 mt-1">Seguimiento de equipos en garantía</p>
      </div>
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 bg-white rounded-xl border border-gray-200 shadow-sm">
        <Shield className="w-14 h-14 mb-4 text-gray-300" />
        <p className="text-base font-medium text-gray-500">Módulo de garantías</p>
        <p className="text-sm mt-1">Próximamente disponible</p>
      </div>
    </div>
  )
}
