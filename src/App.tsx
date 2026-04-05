import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/shared/components/ui/sonner'
import LandingPage from '@/marketing/pages/LandingPage'
import { ProtectedRoute } from '@/app/components/ProtectedRoute'
import { AppLayout } from '@/app/components/AppLayout'
import { LoginPage } from '@/app/pages/LoginPage'
import { DashboardPage } from '@/app/pages/DashboardPage'
import { WorkOrdersPage } from '@/app/pages/WorkOrdersPage'
import { WorkOrderDetailPage } from '@/app/pages/WorkOrderDetailPage'
import { CustomersPage } from '@/app/pages/CustomersPage'
import { StockPage } from '@/app/pages/StockPage'
import { WarrantiesPage } from '@/app/pages/WarrantiesPage'
import { PublicQueryPage } from '@/app/pages/PublicQueryPage'
import { RegisterPage } from '@/app/pages/RegisterPage'
import { SettingsPage } from '@/app/pages/SettingsPage'
import { CustomerDetailPage } from '@/app/pages/CustomerDetailPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/consulta" element={<PublicQueryPage />} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="work-orders" element={<WorkOrdersPage />} />
            <Route path="work-orders/:id" element={<WorkOrderDetailPage />} />
	    <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />
            <Route path="stock" element={<StockPage />} />
            <Route path="warranties" element={<WarrantiesPage />} />
	    <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App
