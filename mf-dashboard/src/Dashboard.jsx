import { useState } from 'react';
import { Search, Activity, CheckCircle, AlertTriangle, MapPin, BarChart3, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Colores para los gráficos (Basados en tu paleta)
const COLORS = ['#A855F7', '#C084FC', '#6366f1', '#14b8a6'];

// 1. SOLUCIÓN AL LINTER: Extraemos el Tooltip fuera del componente principal
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#121218] border border-[#30303D] p-3 rounded-lg shadow-lg">
        <p className="text-[#F4F4F5] font-bold mb-1">{label || payload[0].name}</p>
        <p className="text-[#C084FC] font-medium">{`${payload[0].value} reportes`}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [nlqQuery, setNlqQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Estado inicial
  const [dashboardData, setDashboardData] = useState({
    kpis: { resueltos: 0, criticos: 0, zonas: 0 },
    chartType: 'bar',
    chartData: [],
    titulo: "Esperando consulta del operador..."
  });

  const handleNLQSearch = async (e) => {
    e.preventDefault();
    
    // TAREA 4 (Bug UP-QA-01): Sanitización y recorte de espacios en blanco
    const consultaLimpia = nlqQuery.trim();
    if (!consultaLimpia) {
      setNlqQuery(''); // Limpiamos el input visualmente si solo contenía espacios
      return; 
    }
    
    setIsAnalyzing(true);

    try {
      // TAREA 2: Uso estricto de variables de entorno (Eliminando URL hardcodeada)
      const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
      
      if (!webhookUrl) {
        throw new Error("Variable VITE_N8N_WEBHOOK_URL no configurada en el entorno.");
      }

      // 1. CONEXIÓN CON N8N
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Enviamos la consulta sanitizada, asegurando que no viajen espacios vacíos
        body: JSON.stringify({ consulta: consultaLimpia }) 
      });

      if (!response.ok) {
        throw new Error(`Error de conexión con n8n: ${response.status}`);
      }

      // 2. n8n (Gemini) responde con el JSON estructurado
      const data = await response.json();
      
      // 3. Actualizamos la pantalla con los datos reales
      setDashboardData(data);

    } catch (error) {
      console.error("Error consultando métricas:", error);
      // Si falla la conexión o falta la variable de entorno, avisamos al operador
      setDashboardData({
        kpis: { resueltos: 0, criticos: 0, zonas: 0 },
        chartType: 'bar',
        chartData: [],
        titulo: "Error: Verifica la conexión a n8n o tu archivo .env local."
      });
    } finally {
      // Apagamos la animación de carga, ya sea que haya funcionado o fallado
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      
      {/* 1. BARRA DE BÚSQUEDA NLQ */}
      <div className="bg-[#1B1B24] border border-[#30303D] rounded-2xl p-4 shadow-lg">
        <form onSubmit={handleNLQSearch} className="flex gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-[#A855F7]" size={20} />
            </div>
            <input
              type="text"
              value={nlqQuery}
              onChange={(e) => setNlqQuery(e.target.value)}
              disabled={isAnalyzing}
              placeholder='Ej: "Muéstrame el gráfico de incidentes viales de esta semana en el centro"'
              className="w-full bg-[#0A0A0D] text-[#F4F4F5] placeholder-[#A1A1AA] pl-11 pr-4 py-4 rounded-xl border border-[#30303D] focus:outline-none focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7] transition-all"
            />
          </div>
          <button 
            type="submit"
            disabled={!nlqQuery.trim() || isAnalyzing}
            className="px-6 bg-[#A855F7] text-white font-bold rounded-xl hover:bg-[#C084FC] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
          >
            {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <BarChart3 size={20} />}
            <span className="hidden md:inline">Analizar</span>
          </button>
        </form>
      </div>

      {/* 2. TARJETAS DE KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1B1B24] border border-[#30303D] p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-[#0A0A0D] rounded-xl text-emerald-400 border border-[#30303D]">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-[#A1A1AA] text-sm font-medium">Incidentes Resueltos</p>
            <h3 className="text-2xl font-bold text-[#F4F4F5]">{dashboardData.kpis.resueltos}</h3>
          </div>
        </div>
        
        <div className="bg-[#1B1B24] border border-[#30303D] p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-[#0A0A0D] rounded-xl text-red-400 border border-[#30303D]">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-[#A1A1AA] text-sm font-medium">Zonas Críticas</p>
            <h3 className="text-2xl font-bold text-[#F4F4F5]">{dashboardData.kpis.criticos}</h3>
          </div>
        </div>

        <div className="bg-[#1B1B24] border border-[#30303D] p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-[#0A0A0D] rounded-xl text-[#C084FC] border border-[#30303D]">
            <MapPin size={24} />
          </div>
          <div>
            <p className="text-[#A1A1AA] text-sm font-medium">Sectores Mapeados</p>
            <h3 className="text-2xl font-bold text-[#F4F4F5]">{dashboardData.kpis.zonas}</h3>
          </div>
        </div>
      </div>

      {/* 3. CONTENEDOR DEL GRÁFICO */}
      <div className="flex-1 bg-[#1B1B24] border border-[#30303D] rounded-2xl p-6 min-h-[400px] flex flex-col">
        <h3 className="text-lg font-bold text-[#F4F4F5] mb-6 flex items-center gap-2">
          <Activity className="text-[#A855F7]" size={20} />
          {dashboardData.titulo}
        </h3>
        
        <div className="flex-1 w-full relative">
          {dashboardData.chartData.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#A1A1AA]">
              <BarChart3 size={48} className="mb-4 opacity-20" />
              <p>{dashboardData.titulo.includes("Error") ? "" : "El área de renderizado está lista."}</p>
              <p className="text-sm">{dashboardData.titulo.includes("Error") ? "Revisa la conexión." : "Realiza una consulta a la IA para generar el gráfico."}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {dashboardData.chartType === 'pie' ? (
                <PieChart>
                  <Pie
                    data={dashboardData.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {dashboardData.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              ) : (
                <BarChart data={dashboardData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30303D" vertical={false} />
                  <XAxis dataKey="name" stroke="#A1A1AA" tick={{fill: '#A1A1AA'}} axisLine={false} tickLine={false} />
                  <YAxis stroke="#A1A1AA" tick={{fill: '#A1A1AA'}} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#30303D', opacity: 0.4}} />
                  <Bar dataKey="value" fill="#A855F7" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
}