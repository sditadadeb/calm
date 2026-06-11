import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../api';

const PrivateRoute = ({ children }) => {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setStatus('unauthenticated');
      return;
    }

    getCurrentUser()
      .then((response) => {
        const { username, role, sellerId, sellerName } = response.data;
        localStorage.setItem('user', JSON.stringify({ username, role, sellerId, sellerName }));
        setStatus('authenticated');
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setStatus('unauthenticated');
      });
  }, []);

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F6F6]">
        <div className="w-10 h-10 border-4 border-[#0081FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
