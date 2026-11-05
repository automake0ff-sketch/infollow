import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Suspense } from 'react';

import { LoginPage } from './pages/auth/Login';
import { RegisterPage } from './pages/auth/Register';
import { RecoverPasswordPage } from './pages/auth/RecoverPassword';
import { DashboardPage } from './pages/dashboard/Dashboard';
import { LeadsPage } from './pages/leads/Leads';
import { LeadDetailPage } from './pages/leads/LeadDetail';
import { PropertiesPage } from './pages/properties/Properties';
import { TasksPage } from './pages/tasks/Tasks';
import { VisitsPage } from './pages/visits/Visits';
import { AssistantPage } from './pages/assistant/Assistant';
import { MessagesPage } from './pages/messages/Messages';
import { ConversationAnalyzerPage } from './pages/analyzer/ConversationAnalyzer';
import { AgencyPage } from './pages/agency/Agency';
import { ProfilePage } from './pages/profile/Profile';
import { LandingPage } from './pages/landing/Landing';

import { Layout } from './components/Layout';

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-brand-600 font-medium">Cargando INMO FOLLOW AI...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Inicializando INMO FOLLOW AI...</div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/recover-password" element={<RecoverPasswordPage />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/agency" element={<AgencyPage />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/leads/:id" element={<LeadDetailPage />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/visits" element={<VisitsPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/conversation-analyzer" element={<ConversationAnalyzerPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
