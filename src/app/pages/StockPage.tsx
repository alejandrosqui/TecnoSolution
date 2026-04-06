import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, Package, ArrowDownCircle, ArrowUpCircle, AlertTriangle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { stockService, ProductCreate, StockMovementCreate } from '@/app/services/stockService'
import { useAuthStore } from '@/app/store/authStore'
import { toast } from 'sonner'

// ── Schemas ──────────────────────────────────────────────────────────────────

const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  sku: z.string().optional(),
  brand: z.string().optional(),
  category: z.string().optional(),
  unit_cost: z.string().optional(),
  sale_price: z.string().optional(),
  min_stock_alert: z.string().optional(),
})

const movementSchema = z.object({
  movement_type: z.enum(['entrada', 'salida', 'ajuste']),
  quantity: z.string().min(1, 'Ingresá una cantidad'),
  unit_cost: z.string().optional(),
  reference: z.string().optional(),
})

type ProductFormData = z.infer<typeof productSchema>
type MovementFormData = z.infer<typeof movementSchema>

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number | null) =>
  n != null ? `$${Number(n).toLocaleString('es-AR')}` : '—'

const stockColor = (qty: number, min: number | null) => {
  if (qty <= 0) return 'text-red-600 font-bold'
  if (min != null && qty <= min) return 'text-amber-500 font-semibold'
  return 'text-green-600 font-semibold'
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StockPage() {
  const queryClient = useQueryClient()
  const { activeBranchId } = useAuthStore()

  const [search, setSearch] = useState('')
  const [productDialog, setProductDialog] = useState(false)
  const [movementDialog, setMovementDialog] = useState<string | null>(null) // product_id
  const [isSaving, setIsSaving] = useState(false)

  // ── Queries ──
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', activeBranchId],
    queryFn: () => stockService.list(activeBranchId ?? undefined),
  })

  const filtered = products.filter(p =>
    [p.name, p.sku, p.brand, p.category]
      .filter(Boolean)
      .some(v => v!.toLowerCase().includes(search.toLowerCase()))
  )

  const selectedProduct = products.find(p => p.id === movementDialog)

  // ── Forms ──
  const productForm = useForm<ProductFormData>({ resolver: zodResolver(productSchema) })
  const movementForm = useForm<MovementFormData>({
    resolver: zodResolver(movementSchema),
    defaultValues: { movement_type: 'entrada' },
  })

  // ── Handlers ──
  const onCreateProduct = async (data: ProductFormData) => {
    if (!activeBranchId) { toast.error('No tenés sucursal asignada'); return }
    setIsSaving(true)
    try {
      const payload: ProductCreate = {
        branch_id: activeBranchId,
        name: data.name,
        sku: data.sku || undefined,
        brand: data.brand || undefined,
        category: data.category || undefined,
        unit_cost: data.unit_cost ? parseFloat(data.unit_cost) : undefined,
        sale_price: data.sale_price ? parseFloat(data.sale_price) : undefined,
        min_stock_alert: data.min_stock_alert ? parseFloat(data.min_stock_alert) : undefined,
      }
      await stockService.create(payload)
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Repuesto creado')
      productForm.reset()
      setProductDialog(false)
    } catch {
      toast.error('Error al crear el repuesto')
    } finally {
      setIsSaving(false)
    }
  }

  const onAddMovement = async (data: MovementFormData) => {
    if (!movementDialog) return
    setIsSaving(true)
    try {
      const qty = parseFloat(data.quantity)
      const payload: StockMovementCreate = {
        movement_type: data.movement_type,
        quantity: data.movement_type === 'salida' ? -Math.abs(qty) : Math.abs(qty),
        unit_cost: data.unit_cost ? parseFloat(data.unit_cost) : undefined,
        reference: data.reference || undefined,
      }
      await stockService.addMovement(movementDialog, payload)
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Movimiento registrado')
      movementForm.reset({ movement_type: 'entrada' })
      setMovementDialog(null)
    } catch {
      toast.error('Error al registrar movimiento')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} repuestos registrados</p>
        </div>
        <Button onClick={() => setProductDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo repuesto
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Buscar por nombre, SKU, marca o categoría..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Package className="w-10 h-10 mb-3" />
            <p className="text-sm font-medium">No hay repuestos cargados</p>
            {search && <p className="text-xs mt-1">Probá con otra búsqueda</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Repuesto</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoría</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Costo</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio venta</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900">
                      <div>{p.name}</div>
                      {p.brand && <div className="text-xs text-gray-400">{p.brand}</div>}
                    </td>
                    <td className="px-6 py-3 text-gray-500 font-mono text-xs">{p.sku || '—'}</td>
                    <td className="px-6 py-3 text-gray-500">{p.category || '—'}</td>
                    <td className="px-6 py-3 text-right text-gray-700">{fmt(p.unit_cost)}</td>
                    <td className="px-6 py-3 text-right text-gray-700">{fmt(p.sale_price)}</td>
                    <td className="px-6 py-3 text-right">
                      <span className={stockColor(p.stock_quantity, p.min_stock_alert)}>
                        {p.stock_quantity <= 0 && <AlertTriangle className="inline w-3 h-3 mr-1" />}
                        {Number(p.stock_quantity).toLocaleString('es-AR')}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => { movementForm.reset({ movement_type: 'entrada' }); setMovementDialog(p.id) }}
                        >
                          <ArrowDownCircle className="w-3.5 h-3.5" /> Entrada
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-red-500 border-red-200 hover:bg-red-50"
                          onClick={() => { movementForm.reset({ movement_type: 'salida' }); setMovementDialog(p.id) }}
                        >
                          <ArrowUpCircle className="w-3.5 h-3.5" /> Salida
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Dialog: Nuevo repuesto ── */}
      <Dialog open={productDialog} onOpenChange={open => { setProductDialog(open); if (!open) productForm.reset() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Nuevo repuesto</DialogTitle></DialogHeader>
          <form onSubmit={productForm.handleSubmit(onCreateProduct)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input placeholder="Pantalla iPhone 13" {...productForm.register('name')} />
              {productForm.formState.errors.name && (
                <p className="text-xs text-red-500">{productForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>SKU</Label>
                <Input placeholder="LCD-IP13-BLK" {...productForm.register('sku')} />
              </div>
              <div className="space-y-1.5">
                <Label>Marca</Label>
                <Input placeholder="Apple" {...productForm.register('brand')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Input placeholder="Pantallas, Baterías, Conectores..." {...productForm.register('category')} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Costo ($)</Label>
                <Input type="number" step="0.01" placeholder="15000" {...productForm.register('unit_cost')} />
              </div>
              <div className="space-y-1.5">
                <Label>Precio venta ($)</Label>
                <Input type="number" step="0.01" placeholder="25000" {...productForm.register('sale_price')} />
              </div>
              <div className="space-y-1.5">
                <Label>Alerta mínimo</Label>
                <Input type="number" step="1" placeholder="2" {...productForm.register('min_stock_alert')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setProductDialog(false); productForm.reset() }}>Cancelar</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Movimiento de stock ── */}
      <Dialog open={!!movementDialog} onOpenChange={open => { if (!open) setMovementDialog(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {movementForm.watch('movement_type') === 'salida' ? 'Registrar salida' : 'Registrar entrada'} — {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={movementForm.handleSubmit(onAddMovement)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Tipo de movimiento</Label>
              <select
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
                {...movementForm.register('movement_type')}
              >
                <option value="entrada">Entrada (compra / devolución)</option>
                <option value="salida">Salida (uso en orden / venta)</option>
                <option value="ajuste">Ajuste de inventario</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cantidad *</Label>
                <Input type="number" step="1" min="1" placeholder="1" {...movementForm.register('quantity')} />
                {movementForm.formState.errors.quantity && (
                  <p className="text-xs text-red-500">{movementForm.formState.errors.quantity.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Costo unitario ($)</Label>
                <Input type="number" step="0.01" placeholder="15000" {...movementForm.register('unit_cost')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Referencia</Label>
              <Input placeholder="Nro. orden, factura, remito..." {...movementForm.register('reference')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMovementDialog(null)}>Cancelar</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
