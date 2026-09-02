import { useState, useRef } from 'react';
import { Send, Camera, Bot, User, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import './index.css';

export default function NLQCommandCenter() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sessionId] = useState(() => `sesion-${Date.now()}`);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

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
    if (file) {
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

      // 3. Coordenadas simuladas
      const latActual = -12.0464; 
      const lonActual = -77.0428;

      // 4. Armar el Payload JSON exacto que espera n8n
      const payload = {
        session_id: sessionId,
        mensaje: textoUsuario,
        imagen_base64: imagenBase64,
        latitude: latActual,
        longitude: lonActual
      };

      // 5. Conexión segura usando variable de entorno
      const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
      if (!webhookUrl) throw new Error("Falta VITE_N8N_WEBHOOK_URL");

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
    <div className="flex flex-col h-full bg-[#0A0A0D] text-[#F4F4F5] font-sans">
      
      <header className="bg-[#121218] p-4 border-b border-[#30303D] shadow-md flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Bot className="text-[#A855F7]" size={24} />
          <h1 className="text-xl font-bold tracking-wide">UrbanPulse <span className="text-[#A855F7] font-normal">Command Center</span></h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#C084FC] bg-[#C084FC]/10 px-3 py-1 rounded-full border border-[#C084FC]/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C084FC] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A855F7]"></span>
          </span>
          Sistema Predictivo Activo
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-[#A1A1AA]">
            <Bot size={48} className="mb-4 opacity-20" />
            <p>Describe el incidente...</p>
            <p className="text-sm mt-1">Ej: &quot;Hay un bache gigante frente al parque.&quot;</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.sender === 'ciudadano' ? 'flex-row-reverse' : ''}`}>
            
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-[#30303D] ${msg.sender === 'ciudadano' ? 'bg-[#A855F7]/20 text-[#C084FC]' : 'bg-[#1B1B24] text-[#A855F7]'}`}>
              {msg.sender === 'ciudadano' ? <User size={16} /> : <Bot size={16} />}
            </div>

            <div className={`max-w-[80%] flex flex-col gap-2 ${msg.sender === 'ciudadano' ? 'items-end' : 'items-start'}`}>
              {!msg.isStatusCard && (
                <div className={`p-3 rounded-2xl border border-[#30303D] shadow-sm ${msg.sender === 'ciudadano' ? 'bg-[#A855F7]/10 text-[#F4F4F5] rounded-tr-none' : 'bg-[#1B1B24] text-[#A1A1AA] rounded-tl-none'}`}>
                  {msg.text && <p>{msg.text}</p>}
                  {msg.image && (
                    <img src={msg.image} alt="Reporte" className="mt-2 rounded-lg max-w-xs object-cover border border-[#30303D]" />
                  )}
                </div>
              )}

              {msg.isStatusCard && (
                <div className="bg-[#1B1B24] border-l-4 border-[#A855F7] rounded-r-lg p-4 shadow-[0_4px_20px_rgba(168,85,247,0.1)] w-full max-w-sm mt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="text-[#A855F7]" size={20} />
                    <h3 className="font-bold text-[#F4F4F5]">Ticket #{msg.ticketData.id} Confirmado</h3>
                  </div>
                  <div className="space-y-2 text-sm text-[#A1A1AA]">
                    <p className="flex justify-between border-b border-[#30303D] pb-1">
                      <span>Tipo:</span> <span className="text-[#F4F4F5]">{msg.ticketData.tipo}</span>
                    </p>
                    <p className="flex justify-between border-b border-[#30303D] pb-1 items-center">
                      <span>Gravedad:</span> 
                      <span className="bg-red-900/30 text-red-400 border border-red-900/50 px-2 py-0.5 rounded flex items-center gap-1 font-semibold text-xs">
                        <AlertTriangle size={12} /> {msg.ticketData.gravedad}
                      </span>
                    </p>
                    <p className="flex justify-between border-b border-[#30303D] pb-1">
                      <span>Coordenadas:</span> 
                      <span className="flex items-center gap-1 text-[#C084FC] text-right max-w-[150px]"><MapPin size={12} className="shrink-0"/> {msg.ticketData.gps}</span>
                    </p>
                    <p className="flex justify-between pt-1">
                      <span>Acción:</span> <span className="text-[#A855F7] text-right max-w-[150px]">{msg.ticketData.accion}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isAnalyzing && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1B1B24] border border-[#30303D] flex items-center justify-center shrink-0">
              <Bot size={16} className="text-[#A855F7]" />
            </div>
            <div className="bg-[#1B1B24] border border-[#30303D] p-3 rounded-2xl rounded-tl-none flex items-center gap-3">
              <div className="animate-spin h-4 w-4 border-2 border-[#A855F7] border-t-transparent rounded-full"></div>
              <span className="text-sm text-[#C084FC] animate-pulse">Procesando reporte con IA...</span>
            </div>
          </div>
        )}
      </main>

      <footer className="p-4 bg-[#121218] border-t border-[#30303D]">
        {imagePreview && (
          <div className="mb-3 relative inline-block">
            <img src={imagePreview} alt="Preview" className="h-20 rounded-lg border border-[#A855F7] object-cover" />
            <button 
              onClick={() => setImagePreview(null)}
              className="absolute -top-2 -right-2 bg-[#1B1B24] text-red-400 rounded-full p-1 border border-[#30303D] hover:bg-[#30303D] transition-colors"
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
          <button 
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="p-3 text-[#A1A1AA] hover:text-[#A855F7] hover:bg-[#1B1B24] rounded-xl transition-colors shrink-0"
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
            className="flex-1 bg-[#1B1B24] text-[#F4F4F5] placeholder-[#A1A1AA] px-4 py-3 rounded-xl border border-[#30303D] focus:outline-none focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7] disabled:opacity-50 transition-all"
          />
          <button 
            type="submit"
            disabled={(!inputText.trim() && !imagePreview) || isAnalyzing}
            className="p-3 bg-[#A855F7] text-white rounded-xl hover:bg-[#C084FC] transition-colors disabled:opacity-50 disabled:hover:bg-[#A855F7] shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
          >
            <Send size={20} />
          </button>
        </form>
      </footer>
    </div>
  );
}