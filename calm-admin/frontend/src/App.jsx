import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import Recommendations from './pages/Recommendations';

function App() {
  return (
    <Router>
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
                <Route path="/sellers" element={<Sellers />} />
                <Route path="/branches" element={<Branches />} />
                <Route path="/recommendations" element={<Recommendations />} />
                <Route path="/users" element={<Users />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
