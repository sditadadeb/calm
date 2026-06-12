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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#0B0D11' }}>
      {/* Glow sutil de marca */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-300px', left: '50%', transform: 'translateX(-50%)',
          width: '900px', height: '600px',
          background: 'radial-gradient(ellipse at center, rgba(245,166,35,.08), transparent 65%)',
        }}
      />

      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/favicon.svg" alt="CALM" className="w-12 h-12 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-semibold text-white tracking-wide">CALM</h1>
          <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-slate-500 mt-1">{t('login.subtitle')}</p>
        </div>

        {/* Login Card */}
        <div className="rounded-lg p-7 border" style={{ background: '#12151B', borderColor: 'rgba(255,255,255,0.07)' }}>
          {error && (
            <div className="mb-5 px-3 py-2.5 border border-red-500/30 bg-red-500/10 rounded-md text-red-300 text-[13px] text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-500 mb-1.5">
                {t('login.username')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 rounded-md text-sm text-white placeholder-slate-600 border bg-ink-overlay border-line-strong focus:outline-none focus:border-[#F5A623]/60 focus:ring-1 focus:ring-[#F5A623]/30 transition-colors"
                placeholder={t('login.usernamePlaceholder')}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-500 mb-1.5">
                {t('login.password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-md text-sm text-white placeholder-slate-600 border bg-ink-overlay border-line-strong focus:outline-none focus:border-[#F5A623]/60 focus:ring-1 focus:ring-[#F5A623]/30 transition-colors"
                placeholder={t('login.passwordPlaceholder')}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 mt-1 bg-[#F5A623] text-[#16120A] text-sm font-semibold rounded-md hover:bg-[#FFBB54] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
        <p className="text-center text-slate-600 text-xs mt-6">
          {t('login.footer')}
        </p>
      </div>
    </div>
  );
};

export default Login;
