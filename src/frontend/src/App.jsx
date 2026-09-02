import React, { useState, Suspense } from 'react';
import { Home, MessageSquare, Map as MapIcon, LayoutDashboard, Settings, Activity } from 'lucide-react';
import '@tomtom-international/web-sdk-maps/dist/maps.css';

// Importaciones de los micro-fronteds
const MapaUrbano = React.lazy(() => import('mf_mapa_urbano/MapaUrbano'));
const Dashboard = React.lazy(() => import('mf_dashboard/Dashboard')); 
const Chatbot = React.lazy(() => import('mf_chatbot/Chatbot'));

function App() {
  // El chat es ahora la vista principal por defecto
  const [activeTab, setActiveTab] = useState('chat');

  // Configuración del menú lateral
  const menuItems = [
    { id: 'inicio', label: 'INICIO', icon: Home },
    { id: 'chat', label: 'CHAT', icon: MessageSquare },
    { id: 'mapa', label: 'MAPA', icon: MapIcon },
    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'ajustes', label: 'AJUSTES', icon: Settings },
  ];

  return (
    // Fondo General (#0A0A0D) y Texto Principal (#F4F4F5)
    <div className="flex h-screen overflow-hidden font-sans bg-[#0A0A0D] text-[#F4F4F5]">
      
      {/* SIDEBAR VERTICAL (#121218) */}
      <aside className="w-64 flex flex-col bg-[#121218] border-r border-[#30303D] z-10 shadow-2xl">
        
        {/* LOGO URBANPULSE */}
        <div className="h-20 flex items-center px-6 border-b border-[#30303D]">
          <div className="p-2 bg-[#1B1B24] rounded-lg border border-[#30303D] mr-3 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Activity className="text-[#A855F7]" size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-widest">
            URBAN<span className="text-[#A855F7]">PULSE</span>
          </h1>
        </div>

        {/* NAVEGACIÓN */}
        <nav className="flex-1 py-8 px-4 space-y-3 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 border group ${
                  isActive 
                    ? 'bg-[#1B1B24] text-[#A855F7] border-[#30303D] shadow-[inset_0_0_20px_rgba(168,85,247,0.05)]' 
                    : 'bg-transparent text-[#A1A1AA] border-transparent hover:bg-[#1B1B24] hover:text-[#C084FC] hover:border-[#30303D]/50'
                }`}
              >
                <Icon 
                  size={20} 
                  className={`mr-4 transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'group-hover:scale-110'}`} 
                />
                <span className="font-medium text-sm tracking-widest">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* PERFIL / USUARIO AL FONDO */}
        <div className="p-4 border-t border-[#30303D] bg-[#121218]">
          <div className="flex items-center px-4 py-3 rounded-xl bg-[#1B1B24] border border-[#30303D]">
            <div className="w-9 h-9 rounded-full flex items-center justify-center mr-3 bg-[#0A0A0D] border border-[#30303D] text-[#A855F7]">
              <span className="text-xs font-bold tracking-wider">IA</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-[#F4F4F5]">Operador Activo</span>
              <span className="text-[10px] text-[#A855F7] flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-pulse"></span>
                Sistema En Línea
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 relative overflow-hidden bg-[#0A0A0D]">
        
        {/* VISTA: INICIO */}
        {activeTab === 'inicio' && (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in">
            <Activity size={80} className="text-[#A855F7] mb-8 opacity-20 drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]" />
            <h2 className="text-4xl font-bold mb-4 tracking-tight">Bienvenido a <span className="text-[#A855F7]">UrbanPulse</span></h2>
            <p className="text-[#A1A1AA] max-w-lg text-lg leading-relaxed">
              Sistema predictivo de incidentes urbanos impulsado por Inteligencia Artificial.
            </p>
          </div>
        )}

        {/* VISTA: CHAT (Ahora renderizado como Micro-Frontend Federado) */}
        {activeTab === 'chat' && (
          <div className="h-full w-full animate-fade-in">
            <Suspense fallback={
              <div className="flex flex-col items-center justify-center h-full text-[#A855F7]">
                <MessageSquare size={40} className="mb-4 animate-pulse opacity-50" />
                Inicializando Agente Conversacional...
              </div>
            }>
              <Chatbot />
            </Suspense>
          </div>
        )}

        {/* VISTA: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="h-full overflow-y-auto p-8 animate-fade-in">
            <Suspense fallback={
              <div className="flex flex-col items-center justify-center h-full text-[#A855F7]">
                <div className="animate-spin h-8 w-8 border-2 border-[#A855F7] border-t-transparent rounded-full mb-4"></div>
                Conectando con el panel analítico...
              </div>
            }>
              <Dashboard />
            </Suspense>
          </div>
        )}

        {/* VISTA: MAPA */}
        {activeTab === 'mapa' && (
          <div className="h-full w-full p-6 animate-fade-in">
            <div className="w-full h-full rounded-2xl overflow-hidden border border-[#30303D] bg-[#1B1B24] shadow-lg shadow-[#000000]/50 relative">
              <Suspense fallback={
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#A855F7] bg-[#1B1B24]">
                  <MapIcon size={40} className="mb-4 animate-pulse opacity-50" />
                  Cargando topología...
                </div>
              }>
                <MapaUrbano />
              </Suspense>
            </div>
          </div>
        )}

        {/* VISTA: AJUSTES */}
        {activeTab === 'ajustes' && (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in">
            <Settings size={64} className="text-[#30303D] mb-6 animate-spin-slow" />
            <h2 className="text-2xl font-bold mb-4 text-[#A1A1AA]">Ajustes de Telemetría</h2>
            <p className="text-[#30303D] border border-[#30303D] px-4 py-2 rounded-lg">Módulo restringido en entorno actual</p>
          </div>
        )}
      </main>

    </div>
  );
}

export default App;