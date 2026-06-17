import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { Dashboard } from '../pages/Dashboard';
import { Unauthorized } from '../pages/Unauthorized';
import { ProtectedRoute } from '../components/ProtectedRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public/Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Dashboard Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Placeholder routes for future modules */}
          <Route path="/roadmaps" element={<div className="p-6 text-zinc-400 font-medium">Roadmap Generator Module - Coming Soon</div>} />
          <Route path="/resources" element={<div className="p-6 text-zinc-400 font-medium">Resource Management Module - Coming Soon</div>} />
          <Route path="/productivity" element={<div className="p-6 text-zinc-400 font-medium">Productivity Tracker Module - Coming Soon</div>} />
        </Route>
      </Route>

      {/* Protected Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<div className="p-6 text-zinc-400 font-medium">Admin Dashboard - Coming Soon</div>} />
        </Route>
      </Route>

      {/* Fallback Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
