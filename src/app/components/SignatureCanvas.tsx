import { useRef, useEffect, useState, useCallback } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Eraser, Save, PenLine, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/app/services/api'

interface SignatureCanvasProps {
  workOrderId: string
  orderNumber: string
  onSaved?: () => void
}

interface ExistingSignature {
  url: string
  signed_at: string
  signer_name?: string
}

export function SignatureCanvas({ workOrderId, orderNumber, onSaved }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasStrokes, setHasStrokes] = useState(false)
  const [signerName, setSignerName] = useState('')
  const [saving, setSaving] = useState(false)
  const [existing, setExisting] = useState<ExistingSignature | null>(null)
  const [loadingExisting, setLoadingExisting] = useState(true)
  const [mode, setMode] = useState<'view' | 'draw'>('view')
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    api.get(`/api/work-orders/${workOrderId}/signature`)
      .then(res => setExisting(res.data))
      .catch(() => setExisting(null))
      .finally(() => setLoadingExisting(false))
  }, [workOrderId])

  useEffect(() => {
    if (mode !== 'draw') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [mode])

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    setIsDrawing(true)
    lastPos.current = getPos(e, canvas)
  }, [])

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx || !lastPos.current) return
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
    setHasStrokes(true)
  }, [isDrawing])

  const stopDrawing = useCallback(() => {
    setIsDrawing(false)
    lastPos.current = null
  }, [])

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasStrokes(false)
  }

  const saveSignature = async () => {
    const canvas = canvasRef.current
    if (!canvas || !hasStrokes) {
      toast.error('Dibujá la firma antes de guardar')
      return
    }
    setSaving(true)
    try {
      const imageData = canvas.toDataURL('image/png')
      await api.post(`/api/work-orders/${workOrderId}/signature`, {
        image_data: imageData,
        signer_name: signerName || null,
      })
      toast.success('Firma guardada correctamente')
      const res = await api.get(`/api/work-orders/${workOrderId}/signature`)
      setExisting(res.data)
      setMode('view')
      setHasStrokes(false)
      onSaved?.()
    } catch {
      toast.error('Error al guardar la firma')
    } finally {
      setSaving(false)
    }
  }

  if (loadingExisting) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <PenLine className="h-4 w-4" />
          Firma del cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {existing && mode === 'view' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span>
                Firmado el {new Date(existing.signed_at).toLocaleString('es-AR')}
                {existing.signer_name ? ` por ${existing.signer_name}` : ''}
              </span>
            </div>
            <div className="border rounded-lg overflow-hidden bg-white">
              <img
                src={existing.url}
                alt="Firma del cliente"
                className="w-full max-h-40 object-contain"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => setMode('draw')}>
              Reemplazar firma
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="signer-name">Nombre del firmante (opcional)</Label>
              <Input
                id="signer-name"
                placeholder="Ej: Juan García"
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Firma en el recuadro — funciona con dedo o mouse
            </div>
            <div
              className="border-2 border-dashed border-border rounded-lg overflow-hidden touch-none"
              style={{ background: '#fff' }}
            >
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="w-full block cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearCanvas} disabled={!hasStrokes}>
                <Eraser className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
              <Button size="sm" onClick={saveSignature} disabled={!hasStrokes || saving}>
                <Save className="h-4 w-4 mr-1" />
                {saving ? 'Guardando...' : 'Guardar firma'}
              </Button>
              {existing && (
                <Button variant="ghost" size="sm" onClick={() => setMode('view')}>
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
