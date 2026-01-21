import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import useAuthStore from '../stores/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 mb-4">
            <ClipboardList className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-2">Numia Surveys</h1>
          <p className="text-white/60">Plataforma de encuestas empresarial</p>
        </div>

        {/* Login card */}
        <div className="card gradient-border">
          <h2 className="text-xl font-semibold text-white mb-6">Iniciar Sesión</h2>
          
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-accent-500/20 border border-accent-500/30 text-accent-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError(); }}
                  className="input pl-12"
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); }}
                  className="input pl-12"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-white/60 text-sm">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

