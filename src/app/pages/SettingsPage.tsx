import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Save, Upload } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import api from '@/app/services/api'
import { toast } from 'sonner'

export function SettingsPage() {
  const queryClient = useQueryClient()
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', tax_id: '', slogan: '',
    primary_color: '#2563eb', secondary_color: '#f97316',
    default_diagnosis_hours: 48,
    default_repair_hours: 48,
    default_waiting_days: 7,
    default_pickup_days: 10,
    pickup_alert_enabled: true,
    policies: '',
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const { data: settings, isLoading } = useQuery({
    queryKey: ['my-settings'],
    queryFn: async () => {
      const { data } = await api.get('/api/companies/my/settings')
      return data
    },
  })

  useEffect(() => {
    if (settings) {
      setForm({
        name: settings.name || '',
        email: settings.email || '',
        phone: settings.phone || '',
        address: settings.address || '',
        tax_id: settings.tax_id || '',
        slogan: settings.slogan || '',
        primary_color: settings.primary_color || '#2563eb',
        secondary_color: settings.secondary_color || '#f97316',
        default_diagnosis_hours: settings.default_diagnosis_hours || 48,
        default_repair_hours: settings.default_repair_hours || 48,
        default_waiting_days: settings.default_waiting_days || 7,
        default_pickup_days: settings.default_pickup_days || 10,
        pickup_alert_enabled: settings.pickup_alert_enabled ?? true,
        policies: settings.policies || '',
      })
      if (settings.logo_url) setLogoPreview(settings.logo_url)
    }
  }, [settings])

  const handleFileChange = (file: File, type: 'logo' | 'favicon' | 'banner') => {
    if (type === 'logo') { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)) }
    if (type === 'favicon') setFaviconFile(file)
    if (type === 'banner') setBannerFile(file)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) formData.append(k, String(v)) })
      if (logoFile) formData.append('logo', logoFile)
      if (faviconFile) formData.append('favicon', faviconFile)
      if (bannerFile) formData.append('banner', bannerFile)
      await api.patch('/api/companies/my/settings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      await queryClient.invalidateQueries({ queryKey: ['my-settings'] })
      toast.success('Configuración guardada')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  )

  return (
    <div className="p-6 space-y-6 max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar cambios
        </Button>
      </div>

      {/* Datos de la empresa */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Datos de la empresa</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
            </div>
            <div className="space-y-1.5">
              <Label>CUIT / RUT</Label>
              <Input value={form.tax_id} onChange={e => setForm(f => ({...f, tax_id: e.target.value}))} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Dirección</Label>
            <Input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} />
          </div>
          <div className="space-y-1.5">
            <Label>Eslogan (aparece en documentos impresos)</Label>
            <Input value={form.slogan} onChange={e => setForm(f => ({...f, slogan: e.target.value}))} placeholder="Tu solución tecnológica de confianza" />
          </div>
          <div className="space-y-1.5">
            <Label>Políticas de la empresa (se imprimen en los tickets)</Label>
            <textarea
              rows={4}
              value={form.policies}
              onChange={e => setForm(f => ({...f, policies: e.target.value}))}
              placeholder="Ej: El cliente dispone de 60 días para retirar el equipo una vez reparado..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tiempos y alertas */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Tiempos y alertas</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Horas máx. en "Recibido" antes de alerta</Label>
              <Input type="number" value={form.default_diagnosis_hours}
                onChange={e => setForm(f => ({...f, default_diagnosis_hours: Number(e.target.value)}))} />
              <p className="text-xs text-gray-400">Por defecto: 48hs</p>
            </div>
            <div className="space-y-1.5">
              <Label>Horas máx. en "Reparación" antes de alerta</Label>
              <Input type="number" value={form.default_repair_hours}
                onChange={e => setForm(f => ({...f, default_repair_hours: Number(e.target.value)}))} />
              <p className="text-xs text-gray-400">Por defecto: 48hs</p>
            </div>
            <div className="space-y-1.5">
              <Label>Días máx. esperando repuesto</Label>
              <Input type="number" value={form.default_waiting_days}
                onChange={e => setForm(f => ({...f, default_waiting_days: Number(e.target.value)}))} />
              <p className="text-xs text-gray-400">Por defecto: 7 días</p>
            </div>
            <div className="space-y-1.5">
              <Label>Días para alerta de retiro pendiente</Label>
              <Input type="number" value={form.default_pickup_days}
                onChange={e => setForm(f => ({...f, default_pickup_days: Number(e.target.value)}))} />
              <p className="text-xs text-gray-400">Por defecto: 10 días</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="pickup-alert" checked={form.pickup_alert_enabled}
              onChange={e => setForm(f => ({...f, pickup_alert_enabled: e.target.checked}))}
              className="w-4 h-4 rounded" />
            <Label htmlFor="pickup-alert">Activar alerta cuando el equipo lleva más de X días listo para retirar</Label>
          </div>
        </CardContent>
      </Card>

      {/* Identidad visual */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Identidad visual</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Logo (300x100 px)</Label>
              {logoPreview && <img src={logoPreview} alt="Logo" className="h-16 object-contain border rounded p-1" />}
              <label className="flex items-center gap-2 cursor-pointer text-sm text-blue-600 hover:underline">
                <Upload className="w-4 h-4" />
                Subir logo
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handleFileChange(e.target.files[0], 'logo')} />
              </label>
            </div>
            <div className="space-y-2">
              <Label>Favicon (32x32 px)</Label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-blue-600 hover:underline">
                <Upload className="w-4 h-4" />
                Subir favicon
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handleFileChange(e.target.files[0], 'favicon')} />
              </label>
              {faviconFile && <p className="text-xs text-gray-500">{faviconFile.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>Banner documentos (800x200 px)</Label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-blue-600 hover:underline">
                <Upload className="w-4 h-4" />
                Subir banner
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handleFileChange(e.target.files[0], 'banner')} />
              </label>
              {bannerFile && <p className="text-xs text-gray-500">{bannerFile.name}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Color primario</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.primary_color}
                  onChange={e => setForm(f => ({...f, primary_color: e.target.value}))}
                  className="w-10 h-10 rounded cursor-pointer border" />
                <Input value={form.primary_color}
                  onChange={e => setForm(f => ({...f, primary_color: e.target.value}))}
                  className="font-mono text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Color secundario</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.secondary_color}
                  onChange={e => setForm(f => ({...f, secondary_color: e.target.value}))}
                  className="w-10 h-10 rounded cursor-pointer border" />
                <Input value={form.secondary_color}
                  onChange={e => setForm(f => ({...f, secondary_color: e.target.value}))}
                  className="font-mono text-sm" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
