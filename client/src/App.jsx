import React, { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Inventory from './pages/Inventory';
import Khata from './pages/Khata';
import AIChatPage from './pages/AIChatPage';
import Reports from './pages/Reports';
import DigitalGuide from './pages/DigitalGuide';
import GSTChatbot from './pages/GSTChatbot';

export const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children ? children : <Outlet />;
};
export const AuthLayout = () => {
  const token = localStorage.getItem('token');
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-layout-container">
      <Outlet />
    </div>
  );
};

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const shopName = localStorage.getItem('shopName') || 'Apni Dukaan';
  const userName = localStorage.getItem('userName') || 'Dukaandaar';

  return (
    <div className="dashboard-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="main-wrapper">
        <Navbar
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          shopName={shopName}
          userName={userName}
        />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Root index redirect
const RootRedirect = () => {
  const token = localStorage.getItem('token');
  return token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard"     element={<Dashboard />} />
        <Route path="/billing"        element={<Billing />} />
        <Route path="/products"       element={<Products />} />
        <Route path="/customers"      element={<Customers />} />
        <Route path="/inventory"      element={<Inventory />} />
        <Route path="/khata"          element={<Khata />} />
        <Route path="/assistant"      element={<AIChatPage />} />
        <Route path="/reports"        element={<Reports />} />
        <Route path="/digital-guide"  element={<DigitalGuide />} />
        <Route path="/gst-report"     element={<GSTChatbot />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
