import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  DollarSign, 
  Heart, 
  Award,
  Users,
  Building2,
  ArrowRight,
  TrendingUp,
  UserPlus,
  Target,
  Shield,
  ShieldCheck,
  Percent,
  RefreshCw,
  Activity,
  HeartPulse,
  Stethoscope,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend
} from 'recharts';
import MetricCard from '../components/MetricCard';

// Paleta seria y profesional para aseguradoras
const COLORS = ['#1e3a5f', '#2d5a87', '#3d7ab5', '#5a9fd4', '#7eb8e5', '#a8d4f5'];

// ============ DATOS FAKE PARA DEMO ASEGURADORAS ============
const FAKE_DATA = {
  // Métricas principales de producción
  polizasNuevas: 1847,
  polizasRenovadas: 3256,
  clientesNuevos: 892,
  tasaRetencion: 87.4,
  crossSellingRate: 28.6,
  metaCumplida: 91.2,
  scorePromedio: 8.7,
  
  // Primas (en pesos)
  primasEmitidas: 2450000000, // 2.45 mil millones
  primasCobradas: 2180000000, // 2.18 mil millones
  primaProm: 156000,
  
  // Siniestralidad
  ratioSiniestralidad: 62.3,
  siniestrosTotales: 1234,
  costoPromedioSiniestro: 485000,
  indiceCobranza: 89.0,
  
  // Productos vendidos por ramo
  productosPorRamo: {
    'Salud Individual': 534,
    'Salud Familiar': 423,
    'Vida Individual': 312,
    'Vida con Ahorro': 187,
    'Salud Corporativo': 156,
    'Vida Grupo': 134,
    'Accidentes Personales': 89,
    'Sepelio': 67
  },

  // Razones de no cierre
  razonesNoCierre: {
    'Precio elevado': 187,
    'Ya tiene seguro vigente': 145,
    'Comparando opciones': 123,
    'No califica médicamente': 98,
    'Documentación incompleta': 76,
    'Cliente no interesado': 54
  },

  // Top Productores / Asesores de Seguros
  productores: [
    { id: 1, nombre: 'Lic. María Fernández', zona: 'CABA Norte', polizasNuevas: 87, renovaciones: 156, primaTotal: 42500000, retencion: 94.2, score: 9.4, meta: 98 },
    { id: 2, nombre: 'Juan Carlos Méndez', zona: 'GBA Oeste', polizasNuevas: 74, renovaciones: 142, primaTotal: 38700000, retencion: 91.8, score: 9.1, meta: 95 },
    { id: 3, nombre: 'Dra. Ana Lombardi', zona: 'CABA Sur', polizasNuevas: 68, renovaciones: 128, primaTotal: 35200000, retencion: 89.5, score: 8.9, meta: 92 },
    { id: 4, nombre: 'Roberto Giménez', zona: 'Córdoba', polizasNuevas: 62, renovaciones: 118, primaTotal: 31800000, retencion: 87.3, score: 8.7, meta: 88 },
    { id: 5, nombre: 'Claudia Pereyra', zona: 'Rosario', polizasNuevas: 58, renovaciones: 108, primaTotal: 28500000, retencion: 85.6, score: 8.5, meta: 85 },
    { id: 6, nombre: 'Martín Aguirre', zona: 'Mendoza', polizasNuevas: 52, renovaciones: 96, primaTotal: 25200000, retencion: 83.2, score: 8.3, meta: 82 },
    { id: 7, nombre: 'Luciana Torres', zona: 'GBA Norte', polizasNuevas: 48, renovaciones: 89, primaTotal: 22800000, retencion: 81.4, score: 8.1, meta: 78 },
  ],

  // Sucursales / Zonas
  sucursales: [
    { id: 1, nombre: 'CABA', cotizaciones: 1245, polizas: 423, primas: 890000000, siniestralidad: 58.2, retencion: 92.1 },
    { id: 2, nombre: 'GBA', cotizaciones: 987, polizas: 356, primas: 720000000, siniestralidad: 61.5, retencion: 89.4 },
    { id: 3, nombre: 'Córdoba', cotizaciones: 654, polizas: 234, primas: 480000000, siniestralidad: 64.8, retencion: 86.7 },
    { id: 4, nombre: 'Santa Fe', cotizaciones: 543, polizas: 198, primas: 390000000, siniestralidad: 63.2, retencion: 85.3 },
    { id: 5, nombre: 'Mendoza', cotizaciones: 432, polizas: 156, primas: 310000000, siniestralidad: 59.8, retencion: 88.1 },
  ],

  // Tendencia mensual
  tendenciaMensual: [
    { mes: 'Ago', polizasNuevas: 285, renovaciones: 478, meta: 300 },
    { mes: 'Sep', polizasNuevas: 312, renovaciones: 512, meta: 300 },
    { mes: 'Oct', polizasNuevas: 298, renovaciones: 534, meta: 320 },
    { mes: 'Nov', polizasNuevas: 345, renovaciones: 567, meta: 320 },
    { mes: 'Dic', polizasNuevas: 378, renovaciones: 598, meta: 350 },
    { mes: 'Ene', polizasNuevas: 356, renovaciones: 623, meta: 350 },
  ],

  // Productos más vendidos para gráfico
  productosChart: [
    { producto: 'Salud Indiv.', cantidad: 534 },
    { producto: 'Salud Fam.', cantidad: 423 },
    { producto: 'Vida Indiv.', cantidad: 312 },
    { producto: 'Vida Ahorro', cantidad: 187 },
    { producto: 'Salud Corp.', cantidad: 156 },
  ],

  // Funnel de ventas
  funnelVentas: {
    cotizaciones: 4523,
    propuestas: 2847,
    enTramite: 1234,
    cerradas: 1847
  }
};

// Formatear moneda
const formatCurrency = (value) => {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(2)}B`;
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value}`;
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    // Simular carga de datos
    const timer = setTimeout(() => {
      setData(FAKE_DATA);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Cargando métricas de seguros...</p>
        </div>
      </div>
    );
  }

  const productosData = Object.entries(data.productosPorRamo).map(([name, value]) => ({ name, value }));
  const razonesData = Object.entries(data.razonesNoCierre).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      {/* Meta indicator */}
      <div className="flex justify-end">
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-semibold">Meta: {data.metaCumplida}% cumplida</span>
        </div>
      </div>

      {/* Main Metrics Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Pólizas Nuevas"
          value={data.polizasNuevas.toLocaleString()}
          subtitle="Ventas del mes"
          icon={ShieldCheck}
          variant="primary"
        />
        <MetricCard
          title="Clientes Captados"
          value={data.clientesNuevos}
          subtitle="Nuevos asegurados"
          icon={UserPlus}
          variant="success"
        />
        <MetricCard
          title="Renovaciones"
          value={data.polizasRenovadas.toLocaleString()}
          subtitle="Pólizas renovadas"
          icon={RefreshCw}
          variant="warning"
        />
        <MetricCard
          title="Tasa Retención"
          value={`${data.tasaRetencion}%`}
          subtitle="Clientes que renuevan"
          icon={Award}
          variant="default"
        />
      </div>

      {/* Secondary Metrics Row - Ventas y Producción */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2d4a6f] rounded-[20px] p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium">Primas Emitidas</p>
              <p className="text-3xl font-bold mt-2">{formatCurrency(data.primasEmitidas)}</p>
              <p className="text-white/60 text-sm mt-1">Producción total</p>
            </div>
            <div className="p-3 bg-white/15 rounded-xl">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#047857] to-[#065f46] rounded-[20px] p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium">Cross-Selling</p>
              <p className="text-3xl font-bold mt-2">{data.crossSellingRate}%</p>
              <p className="text-white/60 text-sm mt-1">Venta cruzada</p>
            </div>
            <div className="p-3 bg-white/15 rounded-xl">
              <Percent className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2d5a87] rounded-[20px] p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium">Prima Promedio</p>
              <p className="text-3xl font-bold mt-2">{formatCurrency(data.primaProm)}</p>
              <p className="text-white/60 text-sm mt-1">Por póliza</p>
            </div>
            <div className="p-3 bg-white/15 rounded-xl">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#0f766e] to-[#115e59] rounded-[20px] p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium">Índice Cobranza</p>
              <p className="text-3xl font-bold mt-2">{data.indiceCobranza}%</p>
              <p className="text-white/60 text-sm mt-1">Primas cobradas</p>
            </div>
            <div className="p-3 bg-white/15 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Funnel de Ventas */}
      <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-[#1e3a5f] mb-4">Embudo de Ventas</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="relative">
              <div className="h-24 bg-gradient-to-b from-slate-200 to-slate-100 rounded-t-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-slate-700">{data.funnelVentas.cotizaciones.toLocaleString()}</span>
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[40px] border-r-[40px] border-t-[12px] border-l-transparent border-r-transparent border-t-slate-100"></div>
            </div>
            <p className="text-sm text-gray-600 mt-4 font-medium">Cotizaciones</p>
          </div>
          <div className="text-center">
            <div className="relative">
              <div className="h-20 bg-gradient-to-b from-[#d1e3f3] to-[#e8f1f8] rounded-t-lg flex items-center justify-center mt-2">
                <span className="text-2xl font-bold text-[#1e3a5f]">{data.funnelVentas.propuestas.toLocaleString()}</span>
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[35px] border-r-[35px] border-t-[12px] border-l-transparent border-r-transparent border-t-[#e8f1f8]"></div>
            </div>
            <p className="text-sm text-gray-600 mt-4 font-medium">Propuestas</p>
          </div>
          <div className="text-center">
            <div className="relative">
              <div className="h-16 bg-gradient-to-b from-[#a8d4f5] to-[#c5e3f8] rounded-t-lg flex items-center justify-center mt-4">
                <span className="text-2xl font-bold text-[#1e3a5f]">{data.funnelVentas.enTramite.toLocaleString()}</span>
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[30px] border-r-[30px] border-t-[12px] border-l-transparent border-r-transparent border-t-[#c5e3f8]"></div>
            </div>
            <p className="text-sm text-gray-600 mt-4 font-medium">En Trámite</p>
          </div>
          <div className="text-center">
            <div className="relative">
              <div className="h-12 bg-gradient-to-b from-emerald-200 to-emerald-100 rounded-t-lg flex items-center justify-center mt-6">
                <span className="text-2xl font-bold text-emerald-700">{data.funnelVentas.cerradas.toLocaleString()}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4 font-medium">Pólizas Cerradas</p>
            <p className="text-xs text-emerald-600 font-semibold">{((data.funnelVentas.cerradas / data.funnelVentas.cotizaciones) * 100).toFixed(1)}% conversión</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencia Mensual de Ventas */}
        <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-[#1e3a5f]">Tendencia de Producción</h3>
            <p className="text-sm text-gray-400">Pólizas nuevas y renovaciones vs meta</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.tendenciaMensual}>
              <defs>
                <linearGradient id="colorPolizas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRenovaciones" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#047857" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#047857" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="mes" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid #f0f0f0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="polizasNuevas" 
                name="Pólizas Nuevas"
                stroke="#1e3a5f" 
                fillOpacity={1} 
                fill="url(#colorPolizas)" 
              />
              <Area 
                type="monotone" 
                dataKey="renovaciones" 
                name="Renovaciones"
                stroke="#047857" 
                fillOpacity={1} 
                fill="url(#colorRenovaciones)" 
              />
              <Line 
                type="monotone" 
                dataKey="meta" 
                name="Meta Nuevas"
                stroke="#dc2626" 
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Productos Más Vendidos por Ramo */}
        <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-[#1e3a5f]">Ventas por Ramo</h3>
            <p className="text-sm text-gray-400">Top productos Salud y Vida</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.productosChart} layout="vertical">
              <XAxis type="number" stroke="#9ca3af" fontSize={12} />
              <YAxis type="category" dataKey="producto" stroke="#9ca3af" fontSize={12} width={90} />
              <Tooltip 
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid #f0f0f0',
                  borderRadius: '12px'
                }}
              />
              <Bar dataKey="cantidad" name="Pólizas" fill="#1e3a5f" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por Ramo */}
        <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-[#1e3a5f]">Distribución por Producto</h3>
            <p className="text-sm text-gray-400">Pólizas vendidas por tipo de seguro</p>
          </div>
          <div className="flex items-center">
            <ResponsiveContainer width="50%" height={260}>
              <PieChart>
                <Pie
                  data={productosData.slice(0, 6)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {productosData.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: 'white', 
                    border: '1px solid #f0f0f0',
                    borderRadius: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-1/2 space-y-2">
              {productosData.slice(0, 6).map((item, index) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs text-gray-600 truncate flex-1">{item.name}</span>
                  <span className="text-xs font-bold text-[#2d2d2d]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Razones de No Cierre */}
        <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-[#1e3a5f]">Razones de No Cierre</h3>
            <p className="text-sm text-gray-400">Por qué no se cierran ventas</p>
          </div>
          <div className="flex items-center">
            <ResponsiveContainer width="50%" height={260}>
              <PieChart>
                <Pie
                  data={razonesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {razonesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: 'white', 
                    border: '1px solid #f0f0f0',
                    borderRadius: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-1/2 space-y-2">
              {razonesData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs text-gray-600 truncate flex-1">{item.name}</span>
                  <span className="text-xs font-bold text-[#2d2d2d]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Productores / Asesores */}
        <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-[#1e3a5f] to-[#2d4a6f] rounded-xl shadow-md">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-[#1e3a5f]">Top Productores / Asesores</h3>
              <p className="text-xs text-gray-400">Por cumplimiento de meta</p>
            </div>
          </div>
          <div className="space-y-3">
            {data.productores.slice(0, 5).map((productor, index) => (
              <div 
                key={productor.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-slate-100 transition-colors"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-white shadow-md' :
                  index === 1 ? 'bg-gray-300 text-gray-700' :
                  index === 2 ? 'bg-amber-200 text-amber-800' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1e3a5f] truncate">{productor.nombre}</p>
                  <p className="text-xs text-gray-400 truncate">{productor.zona}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#1e3a5f]">{productor.meta}%</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="text-emerald-600">{productor.polizasNuevas} nuevas</span>
                    <span>•</span>
                    <span>{productor.retencion}% ret.</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link to="/sellers" className="flex items-center justify-center gap-2 mt-4 p-3 text-[#1e3a5f] font-semibold hover:bg-slate-100 rounded-xl transition-colors">
            Ver todos los productores <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Rendimiento por Zona */}
        <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-[#047857] to-[#065f46] rounded-xl shadow-md">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-[#1e3a5f]">Rendimiento por Zona</h3>
              <p className="text-xs text-gray-400">Por primas emitidas</p>
            </div>
          </div>
          <div className="space-y-3">
            {data.sucursales.map((sucursal, index) => (
              <div 
                key={sucursal.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-emerald-50 transition-colors"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-gradient-to-br from-[#047857] to-[#065f46] text-white shadow-md' :
                  index === 1 ? 'bg-gray-300 text-gray-700' :
                  index === 2 ? 'bg-amber-200 text-amber-800' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1e3a5f] capitalize truncate">{sucursal.nombre}</p>
                  <p className="text-xs text-gray-400">{sucursal.cotizaciones.toLocaleString()} cotizaciones</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-600">{formatCurrency(sucursal.primas)}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{sucursal.polizas} pólizas</span>
                    <span>•</span>
                    <span>{sucursal.retencion}% ret.</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link to="/branches" className="flex items-center justify-center gap-2 mt-4 p-3 text-emerald-600 font-semibold hover:bg-emerald-50 rounded-xl transition-colors">
            Ver todas las zonas <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPIs de Siniestralidad y Cobranza */}
      <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-[#1e3a5f] mb-6">Indicadores de Siniestralidad y Cobranza</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#1e3a5f]">{data.ratioSiniestralidad}%</p>
            <p className="text-xs text-gray-500">Siniestralidad</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#1e3a5f]">{data.siniestrosTotales.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Siniestros totales</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <DollarSign className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#1e3a5f]">{formatCurrency(data.costoPromedioSiniestro)}</p>
            <p className="text-xs text-gray-500">Costo prom. siniestro</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#1e3a5f]">{formatCurrency(data.primasCobradas)}</p>
            <p className="text-xs text-gray-500">Primas cobradas</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <HeartPulse className="w-8 h-8 text-[#2d5a87] mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#1e3a5f]">534</p>
            <p className="text-xs text-gray-500">Pólizas Salud</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <Shield className="w-8 h-8 text-[#1e3a5f] mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#1e3a5f]">312</p>
            <p className="text-xs text-gray-500">Pólizas Vida</p>
          </div>
        </div>
      </div>

      {/* Score Promedio de Atención */}
      <div className="bg-gradient-to-r from-[#1e3a5f] via-[#2d5a87] to-[#3d7ab5] rounded-[20px] p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white/90">Score Promedio de Atención</h3>
            <p className="text-white/70 text-sm">Calificación de productores basada en calidad de servicio</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-5xl font-bold">{data.scorePromedio}</p>
              <p className="text-white/70 text-sm">de 10</p>
            </div>
            <div className="p-4 bg-white/15 rounded-xl">
              <Award className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
