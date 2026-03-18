import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, User, Link2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import api, { getSellers } from '../api';

export default function Users() {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'USER', sellerId: '', sellerName: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchSellersData();
  }, []);

  const fetchSellersData = async () => {
    try {
      const response = await getSellers();
      setSellers(response.data || []);
    } catch (err) {
      console.error('Error fetching sellers:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err) {
      setError(t('users.errorLoading'));
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
      setSuccess(t('users.createSuccess'));
      setNewUser({ username: '', password: '', role: 'USER', sellerId: '', sellerName: '' });
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || t('users.errorCreating'));
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (!confirm(`${t('users.confirmDelete')} "${username}"?`)) return;

    try {
      await api.delete(`/users/${id}`);
      setSuccess(t('users.deleteSuccess'));
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || t('users.errorDeleting'));
    }
  };

  const handleToggleRole = async (id, currentRole) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    
    try {
      await api.patch(`/users/${id}/role`, { role: newRole });
      setSuccess(t('users.roleUpdated'));
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || t('users.errorUpdatingRole'));
    }
  };

  const handleSellerChange = (sellerValue) => {
    if (!sellerValue) {
      setNewUser({ ...newUser, sellerId: '', sellerName: '' });
    } else {
      const seller = sellers.find(s => String(s.id || s.userId) === sellerValue);
      setNewUser({ 
        ...newUser, 
        sellerId: sellerValue, 
        sellerName: seller ? (seller.name || seller.userName) : '' 
      });
    }
  };

  const handleUpdateSeller = async (userId, sellerValue) => {
    try {
      let sellerId = null;
      let sellerName = null;
      if (sellerValue) {
        sellerId = Number(sellerValue);
        const seller = sellers.find(s => String(s.id || s.userId) === sellerValue);
        sellerName = seller ? (seller.name || seller.userName) : null;
      }
      await api.patch(`/users/${userId}/seller`, { sellerId, sellerName });
      setSuccess(t('users.sellerUpdated'));
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || t('users.errorUpdatingSeller'));
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
          {t('users.newUser')}
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
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('users.createNewUser')}</h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  {t('users.username')}
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
                  {t('users.password')}
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
                  {t('users.role')}
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className={inputClasses}
                >
                  <option value="USER">{t('users.roleUser')}</option>
                  <option value="ADMIN">{t('users.roleAdmin')}</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-2">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  {t('users.associatedSeller')}
                </label>
                <select
                  value={newUser.sellerId}
                  onChange={(e) => handleSellerChange(e.target.value)}
                  className={inputClasses}
                >
                  <option value="">{t('users.allSellers')}</option>
                  {sellers.map((s) => (
                    <option key={s.id || s.userId} value={s.id || s.userId}>
                      {s.name || s.userName}
                    </option>
                  ))}
                </select>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  {t('users.sellerAssocDesc')}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-[#F5A623] to-[#FFBB54] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                {t('users.createUser')}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {t('users.cancel')}
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
                {t('users.user')}
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {t('users.role')}
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {t('users.seller')}
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {t('users.lastAccess')}
              </th>
              <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {t('common.actions')}
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
                      : user.role === 'VIEWER'
                        ? 'bg-blue-500/20 text-blue-400'
                        : isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {user.role === 'ADMIN' ? 'Admin' : user.role === 'VIEWER' ? 'Viewer' : t('users.userRole')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.sellerId || ''}
                    onChange={(e) => handleUpdateSeller(user.id, e.target.value)}
                    className={`text-sm px-2 py-1 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                  >
                    <option value="">{t('common.all')}</option>
                    {sellers.map((s) => (
                      <option key={s.id || s.userId} value={s.id || s.userId}>
                        {s.name || s.userName}
                      </option>
                    ))}
                  </select>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleString('es-AR') : t('users.never')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleToggleRole(user.id, user.role)}
                      className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-[#F5A623] hover:bg-[#F5A623]/10' : 'text-gray-400 hover:text-[#F5A623] hover:bg-[#F5A623]/10'}`}
                      title={user.role === 'ADMIN' ? t('users.convertToUser') : t('users.convertToAdmin')}
                    >
                      <Shield className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                      title={t('users.deleteUser')}
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
          <strong>{t('users.roles')}:</strong><br />
          • <strong>Admin:</strong> {t('users.adminDesc')}<br />
          • <strong>{t('users.userRole')}:</strong> {t('users.userDesc')}<br />
          • <strong>Viewer:</strong> {t('users.viewerDesc')}<br /><br />
          <strong>{t('users.associatedSeller')}:</strong> {t('users.sellerAssocInfo')}
        </p>
      </div>
    </div>
  );
}
