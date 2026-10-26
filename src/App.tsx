import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import SalesInvoicesPage from './pages/SalesInvoicesPage'
import PurchaseInvoicesPage from './pages/PurchaseInvoicesPage'
import PartiesPage from './pages/PartiesPage'
import ItemsPage from './pages/ItemsPage'
import ReportsPage from './pages/ReportsPage'
import UsersPage from './pages/UsersPage'
import RolesPage from './pages/RolesPage'
import SettingsPage from './pages/SettingsPage'
import AuditPage from './pages/AuditPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="sales" element={<SalesInvoicesPage />} />
        <Route path="purchases" element={<PurchaseInvoicesPage />} />
        <Route path="parties" element={<PartiesPage />} />
        <Route path="items" element={<ItemsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="*" element={<DashboardPage />} />
      </Route>
    </Routes>
  )
}
