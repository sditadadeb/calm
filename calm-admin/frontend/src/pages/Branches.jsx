import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, TrendingUp, Users, Eye, MapPin, DollarSign, RefreshCw, Target, Shield } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

// Datos fake de zonas de seguros
const FAKE_ZONAS = [
  { 
    id: 1, 
    nombre: 'CABA', 
    direccion: 'Ciudad Autónoma de Buenos Aires',
    cotizaciones: 1245, 
    polizasNuevas: 423, 
    renovaciones: 687, 
    primasEmitidas: 890000000,
    retencion: 92.1,
    scorePromedio: 8.8, 
    metaCumplida: 94,
    productores: 8,
    productos: { salud: 245, vida: 142, accidentes: 36 }
  },
  { 
    id: 2, 
    nombre: 'GBA', 
    direccion: 'Gran Buenos Aires',
    cotizaciones: 987, 
    polizasNuevas: 356, 
    renovaciones: 534, 
    primasEmitidas: 720000000,
    retencion: 89.4,
    scorePromedio: 8.5, 
    metaCumplida: 91,
    productores: 7,
    productos: { salud: 198, vida: 118, accidentes: 40 }
  },
  { 
    id: 3, 
    nombre: 'Córdoba', 
    direccion: 'Provincia de Córdoba',
    cotizaciones: 654, 
    polizasNuevas: 234, 
    renovaciones: 378, 
    primasEmitidas: 480000000,
    retencion: 86.7,
    scorePromedio: 8.3, 
    metaCumplida: 88,
    productores: 5,
    productos: { salud: 132, vida: 78, accidentes: 24 }
  },
  { 
    id: 4, 
    nombre: 'Santa Fe', 
    direccion: 'Provincia de Santa Fe',
    cotizaciones: 543, 
    polizasNuevas: 198, 
    renovaciones: 312, 
    primasEmitidas: 390000000,
    retencion: 85.3,
    scorePromedio: 8.1, 
    metaCumplida: 85,
    productores: 4,
    productos: { salud: 112, vida: 65, accidentes: 21 }
  },
  { 
    id: 5, 
    nombre: 'Mendoza', 
    direccion: 'Provincia de Mendoza',
    cotizaciones: 432, 
    polizasNuevas: 156, 
    renovaciones: 267, 
    primasEmitidas: 310000000,
    retencion: 88.1,
    scorePromedio: 7.9, 
    metaCumplida: 82,
    productores: 3,
    productos: { salud: 89, vida: 52, accidentes: 15 }
  },
  { 
    id: 6, 
    nombre: 'Tucumán', 
    direccion: 'Provincia de Tucumán',
    cotizaciones: 321, 
    polizasNuevas: 112, 
    renovaciones: 189, 
    primasEmitidas: 220000000,
    retencion: 84.5,
    scorePromedio: 7.7, 
    metaCumplida: 78,
    productores: 3,
    productos: { salud: 64, vida: 36, accidentes: 12 }
  },
  { 
    id: 7, 
    nombre: 'Mar del Plata', 
    direccion: 'Buenos Aires - Costa Atlántica',
    cotizaciones: 287, 
    polizasNuevas: 98, 
    renovaciones: 156, 
    primasEmitidas: 180000000,
    retencion: 82.8,
    scorePromedio: 7.5, 
    metaCumplida: 74,
    productores: 2,
    productos: { salud: 56, vida: 32, accidentes: 10 }
  },
  { 
    id: 8, 
    nombre: 'Rosario', 
    direccion: 'Santa Fe - Gran Rosario',
    cotizaciones: 245, 
    polizasNuevas: 87, 
    renovaciones: 134, 
    primasEmitidas: 150000000,
    retencion: 81.2,
    scorePromedio: 7.3, 
    metaCumplida: 70,
    productores: 2,
    productos: { salud: 48, vida: 28, accidentes: 11 }
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

export default function Branches() {
  const [loading, setLoading] = useState(true);
  const [zonas, setZonas] = useState([]);

  useEffect(() => {
    // Simular carga de datos
    const timer = setTimeout(() => {
      setZonas(FAKE_ZONAS);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Cargando zonas...</p>
        </div>
      </div>
    );
  }

  const chartData = zonas.map(z => ({
    name: z.nombre.substring(0, 12),
    meta: z.metaCumplida,
    polizas: z.polizasNuevas,
    renovaciones: z.renovaciones,
    retencion: z.retencion
  }));

  const totalCotizaciones = zonas.reduce((acc, z) => acc + z.cotizaciones, 0);
  const totalPrimas = zonas.reduce((acc, z) => acc + z.primasEmitidas, 0);
  const totalPolizas = zonas.reduce((acc, z) => acc + z.polizasNuevas, 0);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-[#1e3a5f] to-[#2d4a6f] rounded-xl flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-[#1e3a5f]">{zonas.length}</p>
          <p className="text-gray-500 text-sm mt-1">Zonas activas</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-[#1e3a5f]">{formatCurrency(totalPrimas)}</p>
          <p className="text-gray-500 text-sm mt-1">Primas emitidas</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-[#2d5a87] to-[#3d7ab5] rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-[#1e3a5f]">{totalPolizas.toLocaleString()}</p>
          <p className="text-gray-500 text-sm mt-1">Pólizas nuevas</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-[#1e3a5f]">{totalCotizaciones.toLocaleString()}</p>
          <p className="text-gray-500 text-sm mt-1">Cotizaciones</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-[#1e3a5f] mb-2">Cumplimiento de Meta por Zona</h3>
          <p className="text-sm text-gray-400 mb-6">Porcentaje de meta mensual alcanzada</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} angle={-45} textAnchor="end" height={60} />
              <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px'
                }}
                formatter={(value) => [`${value}%`, 'Meta cumplida']}
              />
              <Bar dataKey="meta" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-[#1e3a5f] mb-2">Nuevas vs Renovaciones</h3>
          <p className="text-sm text-gray-400 mb-6">Comparativa por zona</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} angle={-45} textAnchor="end" height={60} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px'
                }}
              />
              <Legend />
              <Bar dataKey="polizas" name="Pólizas Nuevas" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
              <Bar dataKey="renovaciones" name="Renovaciones" fill="#047857" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Zones Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-[#1e3a5f]">Detalle por Zona</h3>
          <p className="text-sm text-gray-400">Ranking por cumplimiento de meta</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Zona</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cotizaciones</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pólizas</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Retención</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Meta</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Primas</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {zonas.map((zona, index) => (
                <tr key={zona.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      index === 2 ? 'bg-amber-200 text-amber-800' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#2d5a87] flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="font-medium text-[#1e3a5f] capitalize block">{zona.nombre}</span>
                        <span className="text-xs text-gray-400">{zona.productores} productores</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-[#1e3a5f]">{zona.cotizaciones.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <span className="font-semibold text-[#1e3a5f]">{zona.polizasNuevas}</span>
                      <span className="text-xs text-emerald-600 block">+{zona.renovaciones} renov.</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${
                      zona.retencion >= 85 ? 'text-emerald-600' :
                      zona.retencion >= 75 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {zona.retencion}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${
                        zona.metaCumplida >= 85 ? 'text-emerald-600' :
                        zona.metaCumplida >= 70 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {zona.metaCumplida}%
                      </span>
                      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            zona.metaCumplida >= 85 ? 'bg-emerald-500' :
                            zona.metaCumplida >= 70 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${zona.metaCumplida}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-[#1e3a5f]">{formatCurrency(zona.primasEmitidas)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/transcriptions?branchId=${zona.id}`}
                      className="text-xs py-2 px-3 inline-flex items-center gap-1 bg-slate-100 text-[#1e3a5f] rounded-lg hover:bg-slate-200 transition-colors font-medium"
                    >
                      <Eye className="w-3 h-3" /> Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
