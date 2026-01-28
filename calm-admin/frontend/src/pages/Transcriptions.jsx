import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, XCircle, Eye, Clock, HeartPulse, Shield, ChevronLeft, ChevronRight, Search, ChevronDown } from 'lucide-react';
import ScoreBadge from '../components/ScoreBadge';

// Datos fake de interacciones de seguros
const PRODUCTORES = ['Lic. María Fernández', 'Juan Carlos Méndez', 'Dra. Ana Lombardi', 'Roberto Giménez', 'Claudia Pereyra', 'Martín Aguirre', 'Luciana Torres', 'Fernando Rossi', 'Patricia Vega'];
const ZONAS = ['CABA Norte', 'CABA Sur', 'GBA Oeste', 'GBA Norte', 'Córdoba', 'Rosario', 'Mendoza', 'Tucumán'];
const PRODUCTOS = ['Salud Individual', 'Salud Familiar', 'Vida Individual', 'Vida con Ahorro', 'Salud Corporativo', 'Accidentes Personales', 'Vida Grupo', 'Sepelio'];

// Generar interacciones fake de seguros
const generarInteracciones = () => {
  const interacciones = [];
  let id = 1847;
  
  for (let i = 0; i < 25; i++) {
    const productor = PRODUCTORES[Math.floor(Math.random() * PRODUCTORES.length)];
    const zona = ZONAS[Math.floor(Math.random() * ZONAS.length)];
    const producto = PRODUCTOS[Math.floor(Math.random() * PRODUCTOS.length)];
    const resultado = Math.random() > 0.35;
    const score = resultado ? parseFloat((Math.random() * 2 + 7.5).toFixed(1)) : parseFloat((Math.random() * 2.5 + 5.5).toFixed(1));
    
    let prima = 0;
    if (resultado) {
      if (producto.includes('Corporativo')) prima = Math.floor(Math.random() * 500000) + 200000;
      else if (producto.includes('Familiar')) prima = Math.floor(Math.random() * 80000) + 40000;
      else if (producto.includes('Individual')) prima = Math.floor(Math.random() * 50000) + 20000;
      else if (producto.includes('Ahorro')) prima = Math.floor(Math.random() * 120000) + 60000;
      else if (producto.includes('Grupo')) prima = Math.floor(Math.random() * 300000) + 100000;
      else prima = Math.floor(Math.random() * 30000) + 10000;
    }
    
    // Fecha decreciente
    const diasAtras = Math.floor(i / 8);
    const hora = 17 - (i % 8);
    const minutos = Math.floor(Math.random() * 60);
    const fecha = new Date(2026, 0, 28 - diasAtras, hora, minutos);
    const fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')} ${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;
    
    interacciones.push({
      id: `POL-${id - i}`,
      productor,
      zona,
      fecha: fechaStr,
      tipo: producto,
      resultado,
      prima,
      score
    });
  }
  
  return interacciones;
};

const FAKE_INTERACCIONES = generarInteracciones();
const TOTAL_INTERACCIONES = 1847;

const formatCurrency = (value) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
};

const getTipoIcon = (tipo) => {
  if (tipo.includes('Salud')) return HeartPulse;
  return Shield;
};

export default function Transcriptions() {
  const [loading, setLoading] = useState(true);
  const [interacciones, setInteracciones] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResultado, setFilterResultado] = useState('todos');

  useEffect(() => {
    const timer = setTimeout(() => {
      setInteracciones(FAKE_INTERACCIONES);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Filtrar interacciones
  const filteredInteracciones = interacciones.filter(t => {
    const matchSearch = searchTerm === '' || 
      t.productor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.zona.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchResultado = filterResultado === 'todos' || 
      (filterResultado === 'cerradas' && t.resultado) ||
      (filterResultado === 'no_cerradas' && !t.resultado);
    
    return matchSearch && matchResultado;
  });

  const totalPaginas = Math.ceil(TOTAL_INTERACCIONES / 25);

  return (
    <div className="space-y-6">
      {/* Counter */}
      <div className="flex justify-end">
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-xl border">
          <FileText className="w-4 h-4" />
          <span><strong>{TOTAL_INTERACCIONES.toLocaleString()}</strong> registros totales</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Buscador */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por productor, producto o zona..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
            />
          </div>
          
          {/* Filtro por resultado */}
          <div className="relative min-w-[180px]">
            <select
              value={filterResultado}
              onChange={(e) => setFilterResultado(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] bg-white"
            >
              <option value="todos">Todos los resultados</option>
              <option value="cerradas">Pólizas cerradas</option>
              <option value="no_cerradas">Sin cierre</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-gray-500">Cargando interacciones...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Productor</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Zona</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Producto</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Resultado</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Score</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInteracciones.map((t) => {
                    const TipoIcon = getTipoIcon(t.tipo);
                    return (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-medium text-[#1e3a5f]">{t.id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-[#1e3a5f]">{t.productor}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600">{t.zona}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">{t.fecha}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <TipoIcon className="w-4 h-4 text-[#1e3a5f]" />
                            <span className="text-sm text-gray-700">{t.tipo}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {t.resultado ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                              <CheckCircle className="w-3 h-3" /> Póliza cerrada ({formatCurrency(t.prima)})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                              <XCircle className="w-3 h-3" /> Sin cierre
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <ScoreBadge score={t.score} size="small" />
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            to={`/transcriptions/${t.id}`}
                            className="text-xs py-2 px-3 inline-flex items-center gap-1 bg-slate-100 text-[#1e3a5f] rounded-lg hover:bg-slate-200 transition-colors font-medium"
                          >
                            <Eye className="w-3 h-3" /> Ver detalle
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Paginación */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Mostrando <strong>1-{filteredInteracciones.length}</strong> de <strong>{TOTAL_INTERACCIONES.toLocaleString()}</strong> interacciones
              </p>
              <div className="flex items-center gap-2">
                <button 
                  disabled={pagina === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium">1</span>
                <button className="px-4 py-2 hover:bg-white rounded-lg text-sm text-gray-600">2</button>
                <button className="px-4 py-2 hover:bg-white rounded-lg text-sm text-gray-600">3</button>
                <span className="text-gray-400">...</span>
                <button className="px-4 py-2 hover:bg-white rounded-lg text-sm text-gray-600">{totalPaginas}</button>
                <button 
                  className="p-2 rounded-lg border border-gray-200 hover:bg-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
