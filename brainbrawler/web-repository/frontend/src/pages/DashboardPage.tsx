import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
              <p className="text-gray-600">Benvenuto, {user?.username}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                user?.accountType === 'PREMIUM' 
                  ? 'bg-yellow-100 text-yellow-800'
                  : user?.accountType === 'ADMIN'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {user?.accountType}
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 text-red-600 hover:text-red-800 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Livello {user?.level}</h3>
              <div className="text-3xl font-bold text-blue-600">{user?.xp} XP</div>
              <p className="text-blue-600 text-sm mt-2">Esperienza totale</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Giochi Rapidi</h3>
              <button className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
                Trova Partita
              </button>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-800 mb-2">P2P Games</h3>
              <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors">
                Crea Stanza
              </button>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Funzionalità Implementate</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">🔐 Sistema di Autenticazione</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✅ Registrazione e Login</li>
                  <li>✅ JWT Token Management</li>
                  <li>✅ Account Types (FREE/PREMIUM/ADMIN)</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">🎮 Architettura P2P</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✅ Server Election Algorithm</li>
                  <li>✅ Emergency Mode per FREE users</li>
                  <li>✅ Redis Streams Coordination</li>
                  <li>✅ Feature Management System</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">📊 Database & API</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✅ Prisma Database Schema</li>
                  <li>✅ Question Sets JSON Upload</li>
                  <li>✅ Game Management</li>
                  <li>✅ Friend System</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">🎨 Frontend React</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✅ TypeScript + Tailwind CSS</li>
                  <li>✅ Authentication Context</li>
                  <li>✅ API Service Layer</li>
                  <li>✅ Responsive Design</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">🚧 Prossimi Passi</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>📱 Inizializzazione React Native Mobile App</li>
              <li>🔄 WebRTC P2P Game Engine Implementation</li>
              <li>🎵 Music System & Audio Player</li>
              <li>📈 Advanced Statistics Dashboard</li>
              <li>🎯 Real-time Game Lobby & Matchmaking</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 