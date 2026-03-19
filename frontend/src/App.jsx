import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transcriptions from './pages/Transcriptions';
import TranscriptionDetail from './pages/TranscriptionDetail';
import Sellers from './pages/Sellers';
import Branches from './pages/Branches';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Search from './pages/Search';
import SalesRecommendations from './pages/SalesRecommendations';

function App() {
  return (
    <ThemeProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
                  <Route path="/sales-recommendations" element={<SalesRecommendations />} />
                  <Route path="/sellers" element={<Sellers />} />
                  <Route path="/branches" element={<Branches />} />
                  <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
                  <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
                </Routes>
              </Layout>
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
