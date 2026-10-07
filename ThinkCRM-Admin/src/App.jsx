import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Layouts
import Layout from "./layout/Layout";
import AuthLayout from "./layout/AuthLayout";
import Login from "./pages/auth/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import HomeRedirect from "./components/HomeRedirect";

// Dashboard
const Dashboard = lazy(() => import("./pages/dashboard"));

// Staff & Access
const Staff = lazy(() => import("./pages/staff"));
const StaffNew = lazy(() => import("./pages/staff/new"));
const StaffEdit = lazy(() => import("./pages/staff/edit"));
const Roles = lazy(() => import("./pages/staff/roles"));
const Permissions = lazy(() => import("./pages/staff/permissions"));

// Notifications & Reports
const Notifications = lazy(() => import("./pages/notifications"));
const Analytics = lazy(() => import("./pages/analytics"));
const Reports = lazy(() => import("./pages/reports"));
const ReportUsers = lazy(() => import("./pages/reports/users"));

// System
const Settings = lazy(() => import("./pages/settings"));
const Profile = lazy(() => import("./pages/profile"));
const ChangePassword = lazy(() => import("./pages/change-password"));
const SearchPage = lazy(() => import("./pages/search"));

function App() {
  return (
    <main className="App relative">
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={<Layout />}>
            <Route index element={<HomeRedirect />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Staff */}
            <Route path="staff" element={<Staff />} />
            <Route path="staff/new" element={<StaffNew />} />
            <Route path="staff/:id/edit" element={<StaffEdit />} />
            <Route path="staff/roles" element={<Roles />} />
            <Route path="staff/permissions" element={<Permissions />} />

            {/* Misc */}
            <Route path="notifications" element={<Notifications />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="reports" element={<Reports />} />
            <Route path="reports/users" element={<ReportUsers />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="change-password" element={<ChangePassword />} />
            <Route path="search" element={<SearchPage />} />
          </Route>
        </Route>
      </Routes>
    </main>
  );
}

export default App;
