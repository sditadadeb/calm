import { useLocation } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function ThankYou() {
  const location = useLocation();
  const message = location.state?.message || 'Gracias por completar nuestra encuesta.';

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-md text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="font-display text-2xl font-bold text-white mb-4">¡Gracias!</h1>
        <p className="text-white/70">{message}</p>
      </div>
    </div>
  );
}

