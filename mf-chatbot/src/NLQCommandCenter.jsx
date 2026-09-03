import { useState, useRef } from 'react';
import { Send, Camera, Bot, User, MapPin, AlertTriangle, CheckCircle, LogOut } from 'lucide-react';
import './index.css';
import { getSession, saveSession, clearSession } from './session';
import ChatAuthGate from './ChatAuthGate';

// Fallback si TE_N8N_WEBHOOK_URL no está configurada en el entorno de despliegue,
// igual que en mf-dashboard y mf-mapa-urbano.
const N8N_CHAT_WEBHOOK_URL = 'https://urbanpulse-n8n.xq33kajky1yy6.us-east-1.cs.amazonlightsail.com/webhook/urbanpulse/chat';

// Coordenadas de respaldo (Lima) si el navegador no da permiso de geolocalización o no la soporta
const FALLBACK_LAT = -12.0464;
const FALLBACK_LON = -77.0428;

function obtenerUbicacionActual() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: FALLBACK_LAT, lon: FALLBACK_LON });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve({ lat: FALLBACK_LAT, lon: FALLBACK_LON }),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  });
}

export default function NLQCommandCenter() {
  const [session, setSession] = useState(getSession);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sessionId] = useState(() => `sesion-${Date.now()}`);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleAuth = (authData) => {
    saveSession(authData);
    setSession(authData);
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
  };

  if (!session) {
    return <ChatAuthGate onAuth={handleAuth} />;
  }

  // Función para convertir la imagen a formato Base64 (Texto) para n8n
  const getBase64 = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]); 
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    // TAREA 4: Sanitización para evitar espacios en blanco (Bug UP-QA-01)
    const textoLimpio = inputText.trim();
    if (!textoLimpio && !imagePreview) return;

    const textoUsuario = textoLimpio.toLowerCase();

    // 1. Mostrar el mensaje del ciudadano en la interfaz
    const newUserMessage = {
      id: Date.now(),
      sender: 'ciudadano',
      text: textoLimpio, // Mostramos el texto limpio
      image: imagePreview
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setInputText('');
    setIsAnalyzing(true);

    try {
      // 2. Preparar la imagen si el usuario adjuntó una
      let imagenBase64 = null;
      if (fileInputRef.current && fileInputRef.current.files[0]) {
        imagenBase64 = await getBase64(fileInputRef.current.files[0]);
      }

      // 3. Ubicación real del dispositivo (con respaldo si no hay permiso/soporte)
      const { lat: latActual, lon: lonActual } = await obtenerUbicacionActual();

      // 4. Armar el Payload JSON exacto que espera n8n
      const payload = {
        session_id: sessionId,
        usuario_id: session.id,
        mensaje: textoUsuario,
        imagen_base64: imagenBase64,
        latitude: latActual,
        longitude: lonActual
      };

      // 5. Conexión segura usando variable de entorno
      const webhookUrl = import.meta.env.TE_N8N_WEBHOOK_URL || N8N_CHAT_WEBHOOK_URL;

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Error al procesar el incidente en el servidor');
      }

      const data = await response.json();

      // 6. INTEGRACIÓN CORREGIDA: Leemos el 'estado' que nos manda n8n

      // Siempre mostramos la respuesta de texto de n8n (sea pregunta o confirmación)
      if (data.respuesta) {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'urbanbot',
          text: data.respuesta
        }]);
      }

      // Si n8n nos avisa que el flujo está 'completado', dibujamos también la tarjeta del ticket
      if (data.estado === 'completado' && data.tipo_incidente) {
        const newBotMessage = {
          id: Date.now() + 2,
          sender: 'urbanbot',
          isStatusCard: true,
          ticketData: {
            id: Math.floor(Math.random() * 10000), 
            tipo: data.tipo_incidente, // Mapeado correctamente de n8n
            gravedad: `Prioridad ${data.prioridad} (Riesgo: ${data.score_riesgo})`, // Mapeado correctamente de n8n
            gps: `${latActual}, ${lonActual}`, 
            accion: 'Incidente registrado en sistema central'
          }
        };
        setMessages(prev => [...prev, newBotMessage]);
      }

    } catch (error) {
      console.error("Error en la integración:", error);
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'urbanbot',
        text: 'Lo siento, hubo un problema conectando con los servidores municipales. Intenta de nuevo en unos minutos.'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAnalyzing(false);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-app)] text-[var(--color-text-primary)] font-sans">
      
      <header className="bg-[var(--color-panel)] p-4 border-b border-[var(--color-border)] shadow-md flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Bot className="text-[var(--color-accent)]" size={24} />
          <h1 className="text-xl font-bold tracking-wide">UrbanPulse <span className="text-[var(--color-accent)] font-normal">Command Center</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-[var(--color-accent-light)] bg-[var(--color-accent-light)]/10 px-3 py-1 rounded-full border border-[var(--color-accent-light)]/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent-light)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-accent)]"></span>
            </span>
            {session.username}
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-red-400 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-secondary)]">
            <Bot size={48} className="mb-4 opacity-20" />
            <p>Describe el incidente...</p>
            <p className="text-sm mt-1">Ej: &quot;Hay un bache gigante frente al parque.&quot;</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.sender === 'ciudadano' ? 'flex-row-reverse' : ''}`}>
            
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-[var(--color-border)] ${msg.sender === 'ciudadano' ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent-light)]' : 'bg-[var(--color-card)] text-[var(--color-accent)]'}`}>
              {msg.sender === 'ciudadano' ? <User size={16} /> : <Bot size={16} />}
            </div>

            <div className={`max-w-[80%] flex flex-col gap-2 ${msg.sender === 'ciudadano' ? 'items-end' : 'items-start'}`}>
              {!msg.isStatusCard && (
                <div className={`p-3 rounded-2xl border border-[var(--color-border)] shadow-sm ${msg.sender === 'ciudadano' ? 'bg-[var(--color-accent)]/10 text-[var(--color-text-primary)] rounded-tr-none' : 'bg-[var(--color-card)] text-[var(--color-text-secondary)] rounded-tl-none'}`}>
                  {msg.text && <p>{msg.text}</p>}
                  {msg.image && (
                    <img src={msg.image} alt="Reporte" className="mt-2 rounded-lg max-w-xs object-cover border border-[var(--color-border)]" />
                  )}
                </div>
              )}

              {msg.isStatusCard && (
                <div className="bg-[var(--color-card)] border-l-4 border-[var(--color-accent)] rounded-r-lg p-4 shadow-[0_4px_20px_rgba(168,85,247,0.1)] w-full max-w-sm mt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="text-[var(--color-accent)]" size={20} />
                    <h3 className="font-bold text-[var(--color-text-primary)]">Ticket #{msg.ticketData.id} Confirmado</h3>
                  </div>
                  <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                    <p className="flex justify-between border-b border-[var(--color-border)] pb-1">
                      <span>Tipo:</span> <span className="text-[var(--color-text-primary)]">{msg.ticketData.tipo}</span>
                    </p>
                    <p className="flex justify-between border-b border-[var(--color-border)] pb-1 items-center">
                      <span>Gravedad:</span> 
                      <span className="bg-red-900/30 text-red-400 border border-red-900/50 px-2 py-0.5 rounded flex items-center gap-1 font-semibold text-xs">
                        <AlertTriangle size={12} /> {msg.ticketData.gravedad}
                      </span>
                    </p>
                    <p className="flex justify-between border-b border-[var(--color-border)] pb-1">
                      <span>Coordenadas:</span> 
                      <span className="flex items-center gap-1 text-[var(--color-accent-light)] text-right max-w-[150px]"><MapPin size={12} className="shrink-0"/> {msg.ticketData.gps}</span>
                    </p>
                    <p className="flex justify-between pt-1">
                      <span>Acción:</span> <span className="text-[var(--color-accent)] text-right max-w-[150px]">{msg.ticketData.accion}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isAnalyzing && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
              <Bot size={16} className="text-[var(--color-accent)]" />
            </div>
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-3 rounded-2xl rounded-tl-none flex items-center gap-3">
              <div className="animate-spin h-4 w-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full"></div>
              <span className="text-sm text-[var(--color-accent-light)] animate-pulse">Procesando reporte con IA...</span>
            </div>
          </div>
        )}
      </main>

      <footer className="p-4 bg-[var(--color-panel)] border-t border-[var(--color-border)]">
        {imagePreview && (
          <div className="mb-3 relative inline-block">
            <img src={imagePreview} alt="Preview" className="h-20 rounded-lg border border-[var(--color-accent)] object-cover" />
            <button 
              onClick={() => setImagePreview(null)}
              className="absolute -top-2 -right-2 bg-[var(--color-card)] text-red-400 rounded-full p-1 border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-colors"
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
          <button 
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="p-3 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-card)] rounded-xl transition-colors shrink-0"
            title="Adjuntar fotografía"
          >
            <Camera size={24} />
          </button>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isAnalyzing}
            placeholder="Reporta un incidente...."
            className="flex-1 bg-[var(--color-card)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] px-4 py-3 rounded-xl border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] disabled:opacity-50 transition-all"
          />
          <button 
            type="submit"
            disabled={(!inputText.trim() && !imagePreview) || isAnalyzing}
            className="p-3 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--color-accent-light)] transition-colors disabled:opacity-50 disabled:hover:bg-[var(--color-accent)] shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
          >
            <Send size={20} />
          </button>
        </form>
      </footer>
    </div>
  );
}