import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DataProvider, useData } from './store/dataStore';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { Finance } from './pages/Finance';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { CRM } from './pages/CRM';
import Pipeline from './pages/Pipeline';
import { Estimator } from './pages/Estimator';
import { Admin } from './pages/Admin';
import { Inventory } from './pages/Inventory';
import { Employees } from './pages/Employees';
import Reports from './pages/Reports';

function AppContent() {
  const { currentUser } = useData();
  const isEmployee = currentUser?.role === 'Employee';

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={isEmployee ? <EmployeeDashboard /> : <Dashboard />} />
          <Route path="finance" element={<Finance />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="crm" element={<CRM />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="estimator" element={<Estimator />} />
          <Route path="admin" element={<Admin />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="employees" element={<Employees />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}

export { App };
