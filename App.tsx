import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Nutrition } from './pages/Nutrition';
import { Body } from './pages/Body';
import { Profile } from './pages/Profile';
import { Onboarding } from './pages/Onboarding';
import { Gamification } from './pages/Gamification';

// Protected Route Component to enforce onboarding
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const { userProfile } = useStore();
    if (!userProfile.onboarding_completed) {
        return <Navigate to="/onboarding" replace />;
    }
    return children;
};

const AppRoutes = () => {
    return (
        <Layout>
          <Routes>
            <Route path="/onboarding" element={<Onboarding />} />
            
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/nutrition" element={<ProtectedRoute><Nutrition /></ProtectedRoute>} />
            <Route path="/body" element={<ProtectedRoute><Body /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/gamification" element={<ProtectedRoute><Gamification /></ProtectedRoute>} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
    );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <HashRouter>
          <AppRoutes />
      </HashRouter>
    </StoreProvider>
  );
};

export default App;