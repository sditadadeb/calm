import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../api';

export default function Users() {
  const { isDark } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'USER' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err) {
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.post('/users', newUser);
      setSuccess('Usuario creado exitosamente');
      setNewUser({ username: '', password: '', role: 'USER' });
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear usuario');
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario "${username}"?`)) return;

    try {
      await api.delete(`/users/${id}`);
      setSuccess('Usuario eliminado');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar usuario');
    }
  };

  const handleToggleRole = async (id, currentRole) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    
    try {
      await api.patch(`/users/${id}/role`, { role: newRole });
      setSuccess('Rol actualizado');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar rol');
    }
  };

  const inputClasses = `w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-[#F5A623] focus:border-transparent ${
    isDark 
      ? 'bg-slate-700 border border-slate-600 text-white' 
      : 'bg-white border border-gray-300 text-gray-800'
  }`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5A623]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#F5A623] to-[#FFBB54] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <UserPlus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Create User Form */}
      {showForm && (
        <div className={`rounded-xl border p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Crear Nuevo Usuario</h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  Contraseña
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className={inputClasses}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  Rol
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className={inputClasses}
                >
                  <option value="USER">Usuario (solo lectura)</option>
                  <option value="ADMIN">Administrador (acceso completo)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-[#F5A623] to-[#FFBB54] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Crear Usuario
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <table className="w-full">
          <thead className={isDark ? 'bg-slate-700/50' : 'bg-gray-50'}>
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Usuario
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Rol
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Creado
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Último acceso
              </th>
              <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-200'}`}>
            {users.map((user) => (
              <tr key={user.id} className={`transition-colors ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      user.role === 'ADMIN' ? 'bg-[#F5A623]/20' : isDark ? 'bg-slate-700' : 'bg-gray-100'
                    }`}>
                      {user.role === 'ADMIN' ? (
                        <Shield className="w-5 h-5 text-[#F5A623]" />
                      ) : (
                        <User className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                      )}
                    </div>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{user.username}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.role === 'ADMIN' 
                      ? 'bg-[#F5A623]/20 text-[#F5A623]' 
                      : isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {user.role === 'ADMIN' ? 'Administrador' : 'Usuario'}
                  </span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-AR') : '-'}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleString('es-AR') : 'Nunca'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleToggleRole(user.id, user.role)}
                      className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-[#F5A623] hover:bg-[#F5A623]/10' : 'text-gray-400 hover:text-[#F5A623] hover:bg-[#F5A623]/10'}`}
                      title={user.role === 'ADMIN' ? 'Convertir a Usuario' : 'Convertir a Admin'}
                    >
                      <Shield className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                      title="Eliminar usuario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm text-blue-400">
          <strong>Roles:</strong><br />
          • <strong>Administrador:</strong> Acceso completo (sync, configuración, gestión de usuarios)<br />
          • <strong>Usuario:</strong> Solo visualización de datos (dashboard, transcripciones, vendedores, sucursales)
        </p>
      </div>
    </div>
  );
}
