import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function LeadDetailPage() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando lead...</div>;
  if (!isAuthenticated) return <Navigate to="/auth/login" />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
              {user.agencyId ? user.agencyId.slice(0, 8) : ''}
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Ficha del Cliente</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-gray-500 font-semibold">Información</h3>
              <div className="space-y-2">
                <p className="text-gray-600">{user.agencyId ? `Agencia: ${user.agencyId.slice(0, 8)}` : 'Agencia: N/A'}</p>
                <p className="text-gray-600">{user.fullName}</p>
                <p className="text-gray-600">{user.role}</p>
              </div>
            </div>

            <div>
              <h3 className="text-gray-500 font-semibold">Estado</h3>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.status === 'new' ? 'bg-blue-100 text-blue-700' : user.status === 'interested' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                  {user.status}
                </span>
                <span className="text-sm text-gray-500">{user.status}</span>
              </div>
            </div>

            <div>
              <h3 className="text-gray-500 font-semibold">Detalles</h3>
              <div className="space-y-3">
                <p className="text-gray-600">{user.budget || 'Presupuesto no definido'}</p>
                <p className="text-gray-600">{user.zone || 'Zona: N/A'}</p>
                <p className="text-gray-600">{user.notes || 'Sin notas'}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Próximas Acciones</h3>
            <ul className="space-y-2">
              {[1, 2, 3].map((i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-brand-500 mr-2"></span>
                  <span className="text-gray-600">{i + 1}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
