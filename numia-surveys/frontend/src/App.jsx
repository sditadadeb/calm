import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Surveys from './pages/Surveys';
import SurveyBuilder from './pages/SurveyBuilder';
import SurveyAnalytics from './pages/SurveyAnalytics';
import Contacts from './pages/Contacts';
import Distributions from './pages/Distributions';
import Settings from './pages/Settings';
import PublicSurvey from './pages/PublicSurvey';
import ThankYou from './pages/ThankYou';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/s/:publicId" element={<PublicSurvey />} />
      <Route path="/thank-you" element={<ThankYou />} />
      
      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="surveys" element={<Surveys />} />
        <Route path="surveys/new" element={<SurveyBuilder />} />
        <Route path="surveys/:id/edit" element={<SurveyBuilder />} />
        <Route path="surveys/:id/analytics" element={<SurveyAnalytics />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="distributions" element={<Distributions />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;

