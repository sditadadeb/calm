import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transcriptions from './pages/Transcriptions';
import TranscriptionDetail from './pages/TranscriptionDetail';
import Sellers from './pages/Sellers';
import Branches from './pages/Branches';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Search from './pages/Search';
import Timeline from './pages/Timeline';
import { useEffect } from 'react';

// Componente interno que escucha el evento auth:logout y redirige via React Router
function AuthLogoutListener() {
  const navigate = useNavigate();
  useEffect(() => {
    const handleLogout = () => {
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [navigate]);
  return null;
}

function App() {
  return (
    <LanguageProvider>
    <ThemeProvider>
      <Router>
        <AuthLogoutListener />
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route path="/*" element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/transcriptions" element={<Transcriptions />} />
                  <Route path="/transcriptions/:id" element={<TranscriptionDetail />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/sellers" element={<Sellers />} />
                  <Route path="/branches" element={<Branches />} />
                  <Route path="/timeline" element={<Timeline />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
