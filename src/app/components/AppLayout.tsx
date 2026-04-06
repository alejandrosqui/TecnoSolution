import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Package,
  Shield,
  LogOut,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Settings,
  Shield,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useAuthStore } from '@/app/store/authStore'
import { Button } from '@/shared/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import api from '@/app/services/api'

const navItems = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/work-orders', icon: ClipboardList, label: 'Órdenes' },
  { to: '/app/customers', icon: Users, label: 'Clientes' },
  { to: '/app/stock', icon: Package, label: 'Stock' },
  { to: '/app/warranties', icon: Shield, label: 'Garantías' },
  { to: '/app/settings', icon: Settings, label: 'Configuración' },
  { to: '/app/documents', icon: BookOpen, label: 'Documentación' },
]
export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { data: companySettings } = useQuery({
    queryKey: ['my-settings'],
    queryFn: async () => {
      const { data } = await api.get('/api/companies/my/settings')
      return data
    },
  })
  useEffect(() => {
    if (companySettings?.primary_color) {
      document.documentElement.style.setProperty('--color-primary', companySettings.primary_color)
    }
    if (companySettings?.secondary_color) {
      document.documentElement.style.setProperty('--color-secondary', companySettings.secondary_color)
    }
  }, [companySettings])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col bg-gray-900 text-gray-100 transition-all duration-300',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
  {/* Logo */}
  <div className="flex items-center justify-between px-4 py-5 border-b border-gray-700">
    {!collapsed && (
      <div className="flex items-center gap-2">
        {companySettings?.logo_url ? (
          <img src={companySettings.logo_url} alt="Logo" className="h-8 object-contain max-w-[120px]" />
        ) : (
          <>
            <Wrench className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-sm tracking-wide">
              {companySettings?.name || 'TecnoSolution'}
            </span>
          </>
        )}
      </div>
    )}
    {collapsed && (
      companySettings?.logo_url
        ? <img src={companySettings.logo_url} alt="Logo" className="w-8 h-8 object-contain mx-auto" />
        : <Wrench className="w-5 h-5 text-blue-400 mx-auto" />
    )}
    <button
      onClick={() => setCollapsed(!collapsed)}
      className="text-gray-400 hover:text-white transition-colors ml-auto"
      aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
    >
      {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
    </button>
  </div>
   {/* Nav */}

        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
  {navItems.map(({ to, icon: Icon, label }) => (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-colors',
          isActive
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
        )
      }
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  ))}
  
  {/* Enlace para Superadmin - se muestra SOLO si es superadmin */}
  {user?.is_superadmin && (
    <NavLink
      to="/app/superadmin"
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-colors',
          isActive
            ? 'bg-yellow-500 text-white'
            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
        )
      }
    >
      <Shield className="w-5 h-5 flex-shrink-0" />
      {!collapsed && <span>Superadmin</span>}
    </NavLink>
  )}
</nav>

        {/* User info + logout */}
        <div className="border-t border-gray-700 p-4">
          {!collapsed && user && (
            <div className="mb-3">
              <p className="text-xs font-medium text-white truncate">{user.full_name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className={cn(
              'text-gray-400 hover:text-white hover:bg-gray-800 w-full',
              collapsed ? 'px-2 justify-center' : 'justify-start'
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="ml-2">Cerrar sesión</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
