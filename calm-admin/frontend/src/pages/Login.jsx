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
      setError(err.response?.data?.error || t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#F6F6F6' }}>

      {/* Panel izquierdo — azul institucional */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-16"
        style={{ background: 'linear-gradient(160deg, #0862C5 0%, #0081FF 100%)' }}>
        <img src="/logo-vertical.png" alt="Banco de Occidente"
          className="w-48 mb-10" style={{ filter: 'brightness(0) invert(1)' }} />
        <h2 className="text-white text-3xl font-bold text-center leading-snug">
          Panel de Administración
        </h2>
        <p className="text-blue-100 mt-3 text-center text-base max-w-xs">
          Monitoreo y análisis de atenciones presenciales en sucursales
        </p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">

        {/* Logo visible solo en mobile */}
        <div className="lg:hidden mb-8">
          <img src="/logo-vertical.png" alt="Banco de Occidente" className="h-20 mx-auto" />
        </div>

        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">{t('login.signIn')}</h1>
          <p className="text-gray-500 text-sm mb-8">{t('login.subtitle')}</p>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('login.username')}</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0081FF] focus:border-[#0081FF] transition-all"
                placeholder={t('login.usernamePlaceholder')}
                required autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('login.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0081FF] focus:border-[#0081FF] transition-all"
                placeholder={t('login.passwordPlaceholder')}
                required
              />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#0081FF] hover:bg-[#0862C5] text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm">
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('login.signingIn')}
                </>
              ) : t('login.submit')}
            </button>
          </form>

          <p className="text-center text-gray-400 text-xs mt-8">{t('login.footer')}</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
