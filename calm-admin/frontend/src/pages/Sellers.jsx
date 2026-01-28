import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, Award, Eye, Trophy, DollarSign, RefreshCw, Target, Shield, Search, Filter, ChevronDown, HeartPulse } from 'lucide-react';
import ScoreBadge from '../components/ScoreBadge';

// Zonas disponibles
const ZONAS = ['Todas', 'CABA Norte', 'CABA Sur', 'GBA Oeste', 'GBA Norte', 'GBA Sur', 'Córdoba', 'Rosario', 'Mendoza', 'Tucumán', 'Mar del Plata'];

// Datos fake de 25 productores/asesores de seguros
const FAKE_PRODUCTORES = [
  { 
    id: 1, 
    nombre: 'Lic. María Fernández', 
    zona: 'CABA Norte',
    email: 'maria.fernandez@seguros.com',
    polizasNuevas: 87, 
    renovaciones: 156, 
    primaTotal: 42500000,
    retencion: 94.2,
    crossSelling: 38.5, 
    score: 9.4, 
    meta: 98,
    cotizaciones: 234,
    productos: { salud: 45, vida: 32, accidentes: 10 }
  },
  { 
    id: 2, 
    nombre: 'Juan Carlos Méndez', 
    zona: 'GBA Oeste',
    email: 'jc.mendez@seguros.com',
    polizasNuevas: 74, 
    renovaciones: 142, 
    primaTotal: 38700000,
    retencion: 91.8,
    crossSelling: 35.2, 
    score: 9.1, 
    meta: 95,
    cotizaciones: 198,
    productos: { salud: 38, vida: 28, accidentes: 8 }
  },
  { 
    id: 3, 
    nombre: 'Dra. Ana Lombardi', 
    zona: 'CABA Sur',
    email: 'ana.lombardi@seguros.com',
    polizasNuevas: 68, 
    renovaciones: 128, 
    primaTotal: 35200000,
    retencion: 89.5,
    crossSelling: 32.8, 
    score: 8.9, 
    meta: 98,
    cotizaciones: 187,
    productos: { salud: 35, vida: 25, accidentes: 8 }
  },
  { 
    id: 4, 
    nombre: 'Roberto Giménez', 
    zona: 'Córdoba',
    email: 'roberto.gimenez@seguros.com',
    polizasNuevas: 62, 
    renovaciones: 118, 
    primaTotal: 31800000,
    retencion: 87.3,
    crossSelling: 30.4, 
    score: 8.7, 
    meta: 94,
    cotizaciones: 165,
    productos: { salud: 32, vida: 22, accidentes: 8 }
  },
  { 
    id: 5, 
    nombre: 'Claudia Pereyra', 
    zona: 'Rosario',
    email: 'claudia.pereyra@seguros.com',
    polizasNuevas: 58, 
    renovaciones: 108, 
    primaTotal: 28500000,
    retencion: 85.6,
    crossSelling: 28.9, 
    score: 8.5, 
    meta: 91,
    cotizaciones: 154,
    productos: { salud: 30, vida: 20, accidentes: 8 }
  },
  { 
    id: 6, 
    nombre: 'Martín Aguirre', 
    zona: 'Mendoza',
    email: 'martin.aguirre@seguros.com',
    polizasNuevas: 52, 
    renovaciones: 96, 
    primaTotal: 25200000,
    retencion: 83.2,
    crossSelling: 26.5, 
    score: 8.3, 
    meta: 87,
    cotizaciones: 142,
    productos: { salud: 27, vida: 18, accidentes: 7 }
  },
  { 
    id: 7, 
    nombre: 'Luciana Torres', 
    zona: 'GBA Norte',
    email: 'luciana.torres@seguros.com',
    polizasNuevas: 48, 
    renovaciones: 89, 
    primaTotal: 22800000,
    retencion: 81.4,
    crossSelling: 24.8, 
    score: 8.1, 
    meta: 84,
    cotizaciones: 128,
    productos: { salud: 25, vida: 16, accidentes: 7 }
  },
  { 
    id: 8, 
    nombre: 'Fernando Rossi', 
    zona: 'CABA Norte',
    email: 'fernando.rossi@seguros.com',
    polizasNuevas: 45, 
    renovaciones: 82, 
    primaTotal: 20500000,
    retencion: 79.8,
    crossSelling: 23.2, 
    score: 7.9, 
    meta: 81,
    cotizaciones: 118,
    productos: { salud: 23, vida: 15, accidentes: 7 }
  },
  { 
    id: 9, 
    nombre: 'Patricia Vega', 
    zona: 'GBA Sur',
    email: 'patricia.vega@seguros.com',
    polizasNuevas: 42, 
    renovaciones: 78, 
    primaTotal: 18900000,
    retencion: 78.5,
    crossSelling: 21.6, 
    score: 7.8, 
    meta: 78,
    cotizaciones: 112,
    productos: { salud: 22, vida: 14, accidentes: 6 }
  },
  { 
    id: 10, 
    nombre: 'Diego Morales', 
    zona: 'Tucumán',
    email: 'diego.morales@seguros.com',
    polizasNuevas: 39, 
    renovaciones: 72, 
    primaTotal: 17200000,
    retencion: 76.9,
    crossSelling: 20.3, 
    score: 7.6, 
    meta: 75,
    cotizaciones: 105,
    productos: { salud: 20, vida: 13, accidentes: 6 }
  },
  { 
    id: 11, 
    nombre: 'Silvia Ramírez', 
    zona: 'Mar del Plata',
    email: 'silvia.ramirez@seguros.com',
    polizasNuevas: 36, 
    renovaciones: 68, 
    primaTotal: 15800000,
    retencion: 75.2,
    crossSelling: 19.1, 
    score: 7.5, 
    meta: 72,
    cotizaciones: 98,
    productos: { salud: 19, vida: 12, accidentes: 5 }
  },
  { 
    id: 12, 
    nombre: 'Alejandro Paz', 
    zona: 'Córdoba',
    email: 'alejandro.paz@seguros.com',
    polizasNuevas: 34, 
    renovaciones: 64, 
    primaTotal: 14500000,
    retencion: 73.8,
    crossSelling: 18.2, 
    score: 7.4, 
    meta: 69,
    cotizaciones: 92,
    productos: { salud: 18, vida: 11, accidentes: 5 }
  },
  { 
    id: 13, 
    nombre: 'Carolina Sosa', 
    zona: 'CABA Sur',
    email: 'carolina.sosa@seguros.com',
    polizasNuevas: 32, 
    renovaciones: 58, 
    primaTotal: 13200000,
    retencion: 72.1,
    crossSelling: 17.4, 
    score: 7.3, 
    meta: 66,
    cotizaciones: 87,
    productos: { salud: 17, vida: 10, accidentes: 5 }
  },
  { 
    id: 14, 
    nombre: 'Gustavo Herrera', 
    zona: 'GBA Oeste',
    email: 'gustavo.herrera@seguros.com',
    polizasNuevas: 30, 
    renovaciones: 54, 
    primaTotal: 12100000,
    retencion: 70.5,
    crossSelling: 16.5, 
    score: 7.2, 
    meta: 63,
    cotizaciones: 82,
    productos: { salud: 16, vida: 9, accidentes: 5 }
  },
  { 
    id: 15, 
    nombre: 'Valeria Campos', 
    zona: 'Rosario',
    email: 'valeria.campos@seguros.com',
    polizasNuevas: 28, 
    renovaciones: 52, 
    primaTotal: 11200000,
    retencion: 69.2,
    crossSelling: 15.8, 
    score: 7.1, 
    meta: 60,
    cotizaciones: 78,
    productos: { salud: 15, vida: 9, accidentes: 4 }
  },
  { 
    id: 16, 
    nombre: 'Nicolás Blanco', 
    zona: 'Mendoza',
    email: 'nicolas.blanco@seguros.com',
    polizasNuevas: 26, 
    renovaciones: 48, 
    primaTotal: 10300000,
    retencion: 67.8,
    crossSelling: 14.9, 
    score: 7.0, 
    meta: 57,
    cotizaciones: 72,
    productos: { salud: 14, vida: 8, accidentes: 4 }
  },
  { 
    id: 17, 
    nombre: 'Laura Domínguez', 
    zona: 'GBA Norte',
    email: 'laura.dominguez@seguros.com',
    polizasNuevas: 24, 
    renovaciones: 45, 
    primaTotal: 9500000,
    retencion: 66.4,
    crossSelling: 14.2, 
    score: 6.9, 
    meta: 54,
    cotizaciones: 68,
    productos: { salud: 13, vida: 8, accidentes: 3 }
  },
  { 
    id: 18, 
    nombre: 'Marcelo Ríos', 
    zona: 'CABA Norte',
    email: 'marcelo.rios@seguros.com',
    polizasNuevas: 22, 
    renovaciones: 42, 
    primaTotal: 8800000,
    retencion: 65.1,
    crossSelling: 13.5, 
    score: 6.8, 
    meta: 51,
    cotizaciones: 64,
    productos: { salud: 12, vida: 7, accidentes: 3 }
  },
  { 
    id: 19, 
    nombre: 'Romina Castro', 
    zona: 'Tucumán',
    email: 'romina.castro@seguros.com',
    polizasNuevas: 20, 
    renovaciones: 38, 
    primaTotal: 8100000,
    retencion: 63.7,
    crossSelling: 12.8, 
    score: 6.7, 
    meta: 48,
    cotizaciones: 58,
    productos: { salud: 11, vida: 6, accidentes: 3 }
  },
  { 
    id: 20, 
    nombre: 'Esteban Luna', 
    zona: 'GBA Sur',
    email: 'esteban.luna@seguros.com',
    polizasNuevas: 18, 
    renovaciones: 35, 
    primaTotal: 7400000,
    retencion: 62.3,
    crossSelling: 12.1, 
    score: 6.6, 
    meta: 45,
    cotizaciones: 54,
    productos: { salud: 10, vida: 5, accidentes: 3 }
  },
  { 
    id: 21, 
    nombre: 'Andrea Navarro', 
    zona: 'Mar del Plata',
    email: 'andrea.navarro@seguros.com',
    polizasNuevas: 16, 
    renovaciones: 32, 
    primaTotal: 6800000,
    retencion: 61.0,
    crossSelling: 11.4, 
    score: 6.5, 
    meta: 42,
    cotizaciones: 48,
    productos: { salud: 9, vida: 5, accidentes: 2 }
  },
  { 
    id: 22, 
    nombre: 'Pablo Medina', 
    zona: 'Córdoba',
    email: 'pablo.medina@seguros.com',
    polizasNuevas: 14, 
    renovaciones: 28, 
    primaTotal: 6200000,
    retencion: 59.6,
    crossSelling: 10.7, 
    score: 6.4, 
    meta: 39,
    cotizaciones: 44,
    productos: { salud: 8, vida: 4, accidentes: 2 }
  },
  { 
    id: 23, 
    nombre: 'Gabriela Ortiz', 
    zona: 'CABA Sur',
    email: 'gabriela.ortiz@seguros.com',
    polizasNuevas: 12, 
    renovaciones: 25, 
    primaTotal: 5600000,
    retencion: 58.2,
    crossSelling: 10.0, 
    score: 6.3, 
    meta: 36,
    cotizaciones: 40,
    productos: { salud: 7, vida: 3, accidentes: 2 }
  },
  { 
    id: 24, 
    nombre: 'Sebastián Vera', 
    zona: 'GBA Oeste',
    email: 'sebastian.vera@seguros.com',
    polizasNuevas: 10, 
    renovaciones: 22, 
    primaTotal: 5100000,
    retencion: 56.8,
    crossSelling: 9.3, 
    score: 6.2, 
    meta: 33,
    cotizaciones: 36,
    productos: { salud: 6, vida: 3, accidentes: 1 }
  },
  { 
    id: 25, 
    nombre: 'Mónica Suárez', 
    zona: 'Rosario',
    email: 'monica.suarez@seguros.com',
    polizasNuevas: 8, 
    renovaciones: 18, 
    primaTotal: 4500000,
    retencion: 55.4,
    crossSelling: 8.6, 
    score: 6.1, 
    meta: 30,
    cotizaciones: 32,
    productos: { salud: 5, vida: 2, accidentes: 1 }
  },
];

// Formatear moneda
const formatCurrency = (value) => {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(2)}B`;
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(0)}M`;
  }
  return `$${value.toLocaleString()}`;
};

export default function Sellers() {
  const [loading, setLoading] = useState(true);
  const [productores, setProductores] = useState([]);
  const [filteredProductores, setFilteredProductores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZona, setSelectedZona] = useState('Todas');
  const [sortBy, setSortBy] = useState('meta');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Simular carga de datos
    const timer = setTimeout(() => {
      setProductores(FAKE_PRODUCTORES);
      setFilteredProductores(FAKE_PRODUCTORES);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Filtrar y ordenar
  useEffect(() => {
    let result = [...productores];
    
    // Filtrar por búsqueda
    if (searchTerm) {
      result = result.filter(p => 
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrar por zona
    if (selectedZona !== 'Todas') {
      result = result.filter(p => p.zona === selectedZona);
    }
    
    // Ordenar
    result.sort((a, b) => {
      switch (sortBy) {
        case 'meta': return b.meta - a.meta;
        case 'primas': return b.primaTotal - a.primaTotal;
        case 'retencion': return b.retencion - a.retencion;
        case 'score': return b.score - a.score;
        case 'polizas': return b.polizasNuevas - a.polizasNuevas;
        default: return b.meta - a.meta;
      }
    });
    
    setFilteredProductores(result);
  }, [productores, searchTerm, selectedZona, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Cargando productores...</p>
        </div>
      </div>
    );
  }

  const mejorMeta = Math.max(...productores.map(e => e.meta));
  const scorePromedio = (productores.reduce((acc, e) => acc + e.score, 0) / productores.length).toFixed(1);
  const totalPrimas = productores.reduce((acc, e) => acc + e.primaTotal, 0);
  const retencionPromedio = (productores.reduce((acc, e) => acc + e.retencion, 0) / productores.length).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Counter */}
      <div className="flex justify-end">
        <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-xl border">
          <strong>{filteredProductores.length}</strong> de {productores.length} productores
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-[#1e3a5f] to-[#2d4a6f] rounded-xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-[#1e3a5f]">{productores.length}</p>
          <p className="text-gray-500 text-sm mt-1">Productores activos</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-[#1e3a5f]">{mejorMeta}%</p>
          <p className="text-gray-500 text-sm mt-1">Mejor cumplimiento</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-[#1e3a5f]">{retencionPromedio}%</p>
          <p className="text-gray-500 text-sm mt-1">Retención promedio</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-[#2d5a87] to-[#3d7ab5] rounded-xl flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-[#1e3a5f]">{formatCurrency(totalPrimas)}</p>
          <p className="text-gray-500 text-sm mt-1">Total primas</p>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Buscador */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
            />
          </div>
          
          {/* Filtro por Zona */}
          <div className="relative min-w-[200px]">
            <select
              value={selectedZona}
              onChange={(e) => setSelectedZona(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] bg-white"
            >
              {ZONAS.map(zona => (
                <option key={zona} value={zona}>{zona}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
          
          {/* Ordenar por */}
          <div className="relative min-w-[180px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] bg-white"
            >
              <option value="meta">Ordenar: Meta %</option>
              <option value="primas">Ordenar: Primas</option>
              <option value="retencion">Ordenar: Retención</option>
              <option value="score">Ordenar: Score</option>
              <option value="polizas">Ordenar: Pólizas</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Productores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredProductores.map((productor, index) => {
          // Calcular el ranking real basado en el orden original por meta
          const ranking = FAKE_PRODUCTORES.findIndex(p => p.id === productor.id) + 1;
          
          return (
            <div 
              key={productor.id}
              className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-lg transition-all relative overflow-hidden"
            >
              {/* Rank Badge */}
              {ranking <= 3 && (
                <div className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center ${
                  ranking === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' :
                  ranking === 2 ? 'bg-gray-300' :
                  'bg-amber-200'
                }`}>
                  <Trophy className={`w-3.5 h-3.5 ${
                    ranking === 1 ? 'text-yellow-800' :
                    ranking === 2 ? 'text-gray-600' :
                    'text-amber-700'
                  }`} />
                </div>
              )}

              {/* Productor Info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#2d5a87] flex items-center justify-center">
                  <span className="text-lg font-bold text-white">
                    {productor.nombre.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#1e3a5f] truncate text-sm">{productor.nombre}</h3>
                  <p className="text-xs text-gray-400 truncate">{productor.zona}</p>
                </div>
              </div>

              {/* Main Stats */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-[#1e3a5f]">{productor.meta}%</p>
                  <p className="text-xs text-gray-500">Meta</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-emerald-600">{productor.retencion}%</p>
                  <p className="text-xs text-gray-500">Retención</p>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Pólizas nuevas</span>
                  <span className="font-semibold text-[#1e3a5f]">{productor.polizasNuevas}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Renovaciones</span>
                  <span className="font-semibold text-emerald-600">{productor.renovaciones}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Prima total</span>
                  <span className="font-semibold text-[#1e3a5f]">{formatCurrency(productor.primaTotal)}</span>
                </div>
              </div>

              {/* Products breakdown */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3 p-2 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <HeartPulse className="w-3.5 h-3.5 mx-auto mb-0.5 text-[#2d5a87]" />
                  <span className="font-semibold text-[#1e3a5f]">{productor.productos.salud}</span>
                  <p className="text-[10px]">Salud</p>
                </div>
                <div className="text-center">
                  <Shield className="w-3.5 h-3.5 mx-auto mb-0.5 text-[#1e3a5f]" />
                  <span className="font-semibold text-[#1e3a5f]">{productor.productos.vida}</span>
                  <p className="text-[10px]">Vida</p>
                </div>
                <div className="text-center">
                  <Award className="w-3.5 h-3.5 mx-auto mb-0.5 text-amber-600" />
                  <span className="font-semibold text-[#1e3a5f]">{productor.productos.accidentes}</span>
                  <p className="text-[10px]">Accid.</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <ScoreBadge score={productor.score} size="small" />
                <Link
                  to={`/transcriptions?userId=${productor.id}`}
                  className="text-xs py-1.5 px-2.5 inline-flex items-center gap-1 bg-slate-100 text-[#1e3a5f] rounded-lg hover:bg-slate-200 transition-colors font-medium"
                >
                  <Eye className="w-3 h-3" /> Ver
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredProductores.length === 0 && (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">No se encontraron productores</h3>
          <p className="text-gray-400 mt-2">Intenta ajustar los filtros de búsqueda</p>
        </div>
      )}
    </div>
  );
}
