import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import GroupSelection from './pages/GroupSelection';
import ActivityList from './pages/ActivityList';
import ActivityViewer from './pages/ActivityViewer';
import AdminDashboard from './pages/AdminDashboard';

// Route Shield component enforcing role constraints
function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If Admin attempts to access student route or vice versa, redirect them home
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/groups'} replace />;
  }

  return children;
}

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <Routes>
          {/* Public Authentication */}
          <Route path="/login" element={<Login />} />

          {/* Student Hub Spaces */}
          <Route 
            path="/groups" 
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                <GroupSelection />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/activities" 
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                <ActivityList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/activities/:id" 
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                <ActivityViewer />
              </ProtectedRoute>
            } 
          />

          {/* Admin Management console */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Fallback Redirects */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </div>
    </Router>
  );
}

// Session aware root director
function RootRedirect() {
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  if (token && user) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/groups'} replace />;
  }

  return <Navigate to="/login" replace />;
}
