import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList, Mail, Lock, User, Building2, ArrowRight, Loader2 } from 'lucide-react';
import useAuthStore from '../stores/authStore';

export default function Register() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: ''
  });
  const { register, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await register(form);
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
          <h1 className="font-display text-3xl font-bold text-white mb-2">Crear Cuenta</h1>
          <p className="text-white/60">Empieza a crear encuestas profesionales</p>
        </div>

        {/* Register card */}
        <div className="card gradient-border">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-accent-500/20 border border-accent-500/30 text-accent-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Nombre</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    className="input pl-12"
                    placeholder="Juan"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">Apellido</label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  className="input"
                  placeholder="Pérez"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Nombre de tu Empresa</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  className="input pl-12"
                  placeholder="Mi Empresa S.A."
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="input pl-12"
                  placeholder="tu@empresa.com"
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
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="input pl-12"
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
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
                  Crear Cuenta
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-white/60 text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

