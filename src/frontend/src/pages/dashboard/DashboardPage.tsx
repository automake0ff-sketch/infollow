import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function DashboardPage() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/auth/login" />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Panel Principal</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stats cards */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 font-semibold">Oportunidades Abiertas</h3>
              <span className="text-3xl font-bold text-brand-600">12</span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-brand-600 rounded-full transition-all duration-500" style={{ width: '${(12 / 20) * 100}%' }}></div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-gray-500 font-semibold mb-4">Próximas Acciones</h3>
            <ul className="space-y-3">
              {[1, 2, 3].map((i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-brand-500 mr-2"></span>
                  <span className="text-gray-600">{i + 1}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-gray-500 font-semibold mb-4">Últimas Actividades</h3>
            <ul className="space-y-3">
              {[1, 2, 3].map((i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="text-gray-600">{i + 1}</span>
                  <span className="text-brand-600 font-medium">{`Visita a ${`Lead ${i + 1}`}`}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Siguiente Paso</h3>
          <p className="text-gray-600">
            Revisa tus seguimientos pendientes y contacta a los leads abiertos.
          </p>
        </div>
      </div>
    </div>
  );
}
