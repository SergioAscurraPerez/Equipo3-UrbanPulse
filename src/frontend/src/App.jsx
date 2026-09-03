import React, { useState, useEffect, Suspense } from 'react';
import { Home, MessageSquare, Map as MapIcon, LayoutDashboard, Settings, Activity, Sun, Moon } from 'lucide-react';
import '@tomtom-international/web-sdk-maps/dist/maps.css';
import { getInitialTheme, applyTheme } from './theme';

// Importaciones de los micro-fronteds
const MapaUrbano = React.lazy(() => import('mf_mapa_urbano/MapaUrbano'));
const Dashboard = React.lazy(() => import('mf_dashboard/Dashboard'));
const Chatbot = React.lazy(() => import('mf_chatbot/Chatbot'));

function App() {
  const [activeTab, setActiveTab] = useState('inicio');
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Configuración del menú lateral
  const menuItems = [
    { id: 'inicio', label: 'INICIO', icon: Home },
    { id: 'chat', label: 'CHAT', icon: MessageSquare },
    { id: 'mapa', label: 'MAPA', icon: MapIcon },
    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'ajustes', label: 'AJUSTES', icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-[var(--color-bg-app)] text-[var(--color-text-primary)]">

      {/* SIDEBAR VERTICAL */}
      <aside className="w-64 flex flex-col bg-[var(--color-panel)] border-r border-[var(--color-border)] z-10 shadow-2xl">
        
        {/* LOGO URBANPULSE */}
        <div className="h-20 flex items-center px-6 border-b border-[var(--color-border)]">
          <div className="p-2 bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] mr-3 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Activity className="text-[var(--color-accent)]" size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-widest">
            URBAN<span className="text-[var(--color-accent)]">PULSE</span>
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
                    ? 'bg-[var(--color-card)] text-[var(--color-accent)] border-[var(--color-border)] shadow-[inset_0_0_20px_rgba(168,85,247,0.05)]' 
                    : 'bg-transparent text-[var(--color-text-secondary)] border-transparent hover:bg-[var(--color-card)] hover:text-[var(--color-accent-light)] hover:border-[var(--color-border)]/50'
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
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-panel)] space-y-3">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-light)] hover:border-[var(--color-border)]/50 transition-colors"
            title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span className="text-xs font-medium tracking-wide">
              {theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
            </span>
          </button>

          <div className="flex items-center px-4 py-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)]">
            <div className="w-9 h-9 rounded-full flex items-center justify-center mr-3 bg-[var(--color-bg-app)] border border-[var(--color-border)] text-[var(--color-accent)]">
              <span className="text-xs font-bold tracking-wider">IA</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-[var(--color-text-primary)]">Operador Activo</span>
              <span className="text-[10px] text-[var(--color-accent)] flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse"></span>
                Sistema En Línea
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 relative overflow-hidden bg-[var(--color-bg-app)]">
        
        {/* VISTA: INICIO (Landing) */}
        {activeTab === 'inicio' && (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in overflow-y-auto">
            <div className="p-4 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] mb-6 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
              <Activity size={48} className="text-[var(--color-accent)]" />
            </div>
            <h1 className="text-4xl font-bold mb-3 tracking-tight">
              URBAN<span className="text-[var(--color-accent)]">PULSE</span>
            </h1>
            <p className="text-[var(--color-text-secondary)] max-w-lg text-lg leading-relaxed mb-3">
              Sistema predictivo de incidentes urbanos impulsado por Inteligencia Artificial.
            </p>
            <span className="text-xs text-[var(--color-accent)] flex items-center gap-1.5 mb-10">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse"></span>
              Sistema En Línea
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
              {[
                { id: 'chat', label: 'Chat', desc: 'Reporta un incidente conversando con el agente de IA.', icon: MessageSquare },
                { id: 'mapa', label: 'Mapa', desc: 'Visualiza incidentes y congestión en tiempo real.', icon: MapIcon },
                { id: 'dashboard', label: 'Dashboard', desc: 'Revisa KPIs y tendencias de la ciudad.', icon: LayoutDashboard },
              ].map(({ id, label, desc, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="flex flex-col items-start text-left gap-3 p-5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 hover:-translate-y-0.5 transition-all"
                >
                  <div className="p-2 bg-[var(--color-panel)] rounded-lg border border-[var(--color-border)] text-[var(--color-accent)]">
                    <Icon size={20} />
                  </div>
                  <span className="font-bold text-[var(--color-text-primary)]">{label}</span>
                  <span className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* VISTA: CHAT (Ahora renderizado como Micro-Frontend Federado) */}
        {activeTab === 'chat' && (
          <div className="h-full w-full animate-fade-in">
            <Suspense fallback={
              <div className="flex flex-col items-center justify-center h-full text-[var(--color-accent)]">
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
              <div className="flex flex-col items-center justify-center h-full text-[var(--color-accent)]">
                <div className="animate-spin h-8 w-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full mb-4"></div>
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
            <div className="w-full h-full rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg shadow-[#000000]/50 relative">
              <Suspense fallback={
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--color-accent)] bg-[var(--color-card)]">
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
            <Settings size={64} className="text-[var(--color-border)] mb-6 animate-spin-slow" />
            <h2 className="text-2xl font-bold mb-4 text-[var(--color-text-secondary)]">Ajustes de Telemetría</h2>
            <p className="text-[var(--color-border)] border border-[var(--color-border)] px-4 py-2 rounded-lg">Módulo restringido en entorno actual</p>
          </div>
        )}
      </main>

    </div>
  );
}

export default App;