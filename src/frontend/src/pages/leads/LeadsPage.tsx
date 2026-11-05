import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function LeadsPage() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando leads...</div>;
  if (!isAuthenticated) return <Navigate to="/auth/login" />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Clientes</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Leads list */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-gray-500 font-semibold mb-4">Listado de Leads</h3>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((id) => {
                const lead = {
                  id,
                  name: `Cliente ${id}`,
                  status: id % 2 === 0 ? 'visit_pending' : 'interested',
                  budget: id * 10000,
                  lastActivity: new Date(Date.now() - (id * 2) * 3600000).toLocaleString(),
                };
                return (
                  <div key={lead.id} className="flex items-center gap-4 p-4 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                      {lead.name.split(' ').length > 2 ? '' : lead.name.split(' ').length}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{lead.name}</div>
                      <div className="text-sm text-gray-500">{lead.status}</div>
                    </div>
                    <button
                      onClick={() => window.location.hash = `#leads/${lead.id}`}
                      className="ml-auto text-brand-600 hover:text-brand-700 font-medium"
                    >
                      Ver
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
