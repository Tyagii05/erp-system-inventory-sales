import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import SalesOrders from './pages/SalesOrders';
import PurchaseOrders from './pages/PurchaseOrders';
import GRNs from './pages/GRNs';
import Invoices from './pages/Invoices';
import Reports from './pages/Reports';
import type { UserRole } from './types';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'INVENTORY_MGR', 'SALES_EXEC']}>
            <Layout>
              <Products />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'SALES_EXEC']}>
            <Layout>
              <Customers />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/suppliers"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'PURCHASE_MGR']}>
            <Layout>
              <Suppliers />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales-orders"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'SALES_EXEC']}>
            <Layout>
              <SalesOrders />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/purchase-orders"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'PURCHASE_MGR']}>
            <Layout>
              <PurchaseOrders />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/grns"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'INVENTORY_MGR', 'PURCHASE_MGR']}>
            <Layout>
              <GRNs />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTANT', 'SALES_EXEC']}>
            <Layout>
              <Invoices />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTANT']}>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

