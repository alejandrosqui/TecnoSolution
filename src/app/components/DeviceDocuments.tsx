import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Upload, Trash2, Loader2, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import api from '@/app/services/api'
import { toast } from 'sonner'

interface Props {
  brand: string
  model: string
}

const DOC_TYPE_LABELS: Record<string, string> = {
  manual: 'Manual',
  esquema: 'Esquema',
  calibracion: 'Calibración',
  garantia: 'Garantía',
  otro: 'Otro',
}

export function DeviceDocuments({ brand, model }: Props) {
  const queryClient = useQueryClient()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', doc_type: 'manual' })
  const [file, setFile] = useState<File | null>(null)

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['device-documents', brand, model],
    queryFn: async () => {
      const { data } = await api.get('/api/device-documents/', { params: { brand, model } })
      return data as {
        id: string
        name: string
        description: string
        doc_type: string
        file_name: string
        file_size: number
        url: string
        created_at: string
      }[]
    },
    enabled: !!brand && !!model,
  })

  const handleUpload = async () => {
    if (!file || !form.name) {
      toast.error('Completá el nombre y seleccioná un archivo')
      return
    }
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('brand', brand)
      formData.append('model', model)
      formData.append('name', form.name)
      formData.append('description', form.description)
      formData.append('doc_type', form.doc_type)
      formData.append('file', file)
      await api.post('/api/device-documents/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      await queryClient.invalidateQueries({ queryKey: ['device-documents', brand, model] })
      toast.success('Documento subido correctamente')
      setUploadOpen(false)
      setForm({ name: '', description: '', doc_type: 'manual' })
      setFile(null)
    } catch {
      toast.error('Error al subir el documento')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (docId: string) => {
    try {
      await api.delete(`/api/device-documents/${docId}`)
      await queryClient.invalidateQueries({ queryKey: ['device-documents', brand, model] })
      toast.success('Documento eliminado')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Documentación del dispositivo
              <span className="ml-2 text-xs font-normal text-gray-400">{brand} {model}</span>
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setUploadOpen(true)} className="gap-2">
              <Upload className="w-4 h-4" />
              Subir doc
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : docs.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Sin documentación para este modelo</p>
              <p className="text-xs mt-1">Subí manuales, esquemas o calibraciones</p>
            </div>
          ) : (
            <div className="space-y-2">
              {docs.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                    <p className="text-xs text-gray-400">
                      {DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type} · {formatSize(doc.file_size)} · {doc.file_name}
                    </p>
                    {doc.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{doc.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="ghost" className="gap-1 text-blue-600 hover:text-blue-700">
                        <ExternalLink className="w-3.5 h-3.5" />
                        Ver
                      </Button>
                    </a>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(doc.id)}
                      className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Subir documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre del documento *</Label>
              <Input placeholder="Manual de servicio Samsung S23"
                value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.doc_type} onValueChange={v => setForm(f => ({...f, doc_type: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Descripción (opcional)</Label>
              <Input placeholder="Ej: Rev. 3.2, incluye diagrama de placa"
                value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
            </div>
            <div className="space-y-1.5">
              <Label>Archivo *</Label>
              <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.zip"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              {file && <p className="text-xs text-gray-400">{file.name} · {formatSize(file.size)}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Subir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
