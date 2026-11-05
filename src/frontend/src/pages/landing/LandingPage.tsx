import React from 'react';
import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-12">
      <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
        INMO FOLLOW AI
      </h1>
      <p className="text-lg text-gray-200 mb-8">
        Tu copiloto comercial inmobiliario con IA. No dejes oportunidades sin seguir.
      </p>
      <div className="flex gap-4 justify-center">
        <Link to="/auth/login" className="px-6 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors">
          Iniciar Sesión
        </Link>
        <Link to="/auth/register" className="px-6 py-3 bg-white text-brand-600 rounded-lg font-medium hover:bg-gray-100 transition-colors">
          Registrarse
        </Link>
      </div>
    </div>
  );
}
