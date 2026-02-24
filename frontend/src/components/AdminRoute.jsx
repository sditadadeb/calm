import { Navigate } from 'react-router-dom';

export default function AdminRoute({ children }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'ADMIN';

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
