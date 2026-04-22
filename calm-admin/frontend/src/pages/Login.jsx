import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(username, password);
      const { token, username: user, role, sellerId, sellerName } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ username: user, role, sellerId, sellerName }));
      
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0862C5 0%, #003580 50%, #001a40 100%)' }}>
      {/* Patrón sutil de fondo */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M20 20l-8-8h16l-8 8zm0 0l8 8H12l8-8z'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo vertical oficial */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img
              src="/logo-vertical.png"
              alt="Banco de Occidente"
              className="h-28 w-auto drop-shadow-lg"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
          <p className="text-blue-200 text-sm">{t('login.subtitle')}</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">{t('login.signIn')}</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('login.username')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0081FF] focus:border-[#0081FF] transition-all"
                placeholder={t('login.usernamePlaceholder')}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('login.password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0081FF] focus:border-[#0081FF] transition-all"
                placeholder={t('login.passwordPlaceholder')}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#E70518] hover:bg-[#FF283A] text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E70518] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-red-500/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('login.signingIn')}
                </span>
              ) : (
                t('login.submit')
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-300 text-sm mt-6">
          {t('login.footer')}
        </p>
      </div>
    </div>
  );
};

export default Login;
