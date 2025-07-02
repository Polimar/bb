import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import api from '../services/api';

const LoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [developmentCode, setDevelopmentCode] = useState('');

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Si è verificato un errore');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/register', {
        username,
        email,
        password
      });

      setDevelopmentCode(response.data.developmentCode || '');
      setShowVerification(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Si è verificato un errore');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/verify-email', {
        email,
        code: verificationCode
      });

      // Store tokens and redirect
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.error || 'Codice di verifica non valido');
    } finally {
      setLoading(false);
    }
  };

  if (showVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-500 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-2">📧</h1>
            <h2 className="text-3xl font-bold text-white">Verifica Email</h2>
            <p className="text-primary-100 mt-2">Inserisci il codice a 6 cifre</p>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-8">
            <form onSubmit={handleVerifyEmail} className="space-y-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Codice di Verifica
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  required
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-center text-2xl tracking-widest"
                  placeholder="123456"
                />
              </div>

              {process.env.NODE_ENV === 'development' && developmentCode && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800 mb-2">🚧 Modalità Sviluppo</p>
                  <button
                    type="button"
                    onClick={() => setVerificationCode(developmentCode)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                  >
                    Mostra Codice ({developmentCode})
                  </button>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Verifica Email'
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setShowVerification(false);
                  setVerificationCode('');
                  setDevelopmentCode('');
                  setError('');
                }}
                className="text-primary-600 hover:text-primary-500 text-sm"
              >
                ← Torna alla registrazione
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-500 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-2">🧠</h1>
          <h2 className="text-3xl font-bold text-white">BrainBrawler</h2>
          <p className="text-primary-100 mt-2">Quiz P2P Platform</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  isLogin
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Accedi
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  !isLogin
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Registrati
              </button>
            </div>
          </div>

          <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-6">
            {!isLogin && (
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required={!isLogin}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Il tuo username"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="la.tua@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                isLogin ? 'Accedi' : 'Registrati'
              )}
            </button>
          </form>

          {!isLogin && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Account Premium - €4.99/mese</h3>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>✅ Crea giochi illimitati</li>
                <li>✅ Carica set di domande personalizzati</li>
                <li>✅ Carica tracce musicali</li>
                <li>✅ Statistiche avanzate</li>
                <li>✅ Esperienza senza pubblicità</li>
              </ul>
            </div>
          )}

          {isLogin && (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-600 text-center">
                🔐 <strong>Admin:</strong> admin@brainbrawler.com / BrainBrawler2024!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 