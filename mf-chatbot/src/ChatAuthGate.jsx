import { useState } from 'react';
import { Bot, Lock, User, Loader2, AlertTriangle } from 'lucide-react';

// Fallback si las variables de entorno no están configuradas en el despliegue
const N8N_AUTH_LOGIN_URL = 'https://urbanpulse-n8n.xq33kajky1yy6.us-east-1.cs.amazonlightsail.com/webhook/urbanpulse/auth/login';
const N8N_AUTH_REGISTER_URL = 'https://urbanpulse-n8n.xq33kajky1yy6.us-east-1.cs.amazonlightsail.com/webhook/urbanpulse/auth/register';

export default function ChatAuthGate({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setStatus('loading');
    setError(null);

    try {
      const isRegister = mode === 'register';
      const webhookUrl = isRegister
        ? (import.meta.env.TE_N8N_AUTH_REGISTER_URL || N8N_AUTH_REGISTER_URL)
        : (import.meta.env.TE_N8N_AUTH_LOGIN_URL || N8N_AUTH_LOGIN_URL);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || (isRegister ? 'No se pudo crear la cuenta.' : 'Credenciales inválidas'));
      }

      onAuth(data);
    } catch (err) {
      setError(err.message || 'No se pudo conectar con el servidor de autenticación.');
      setStatus('error');
    }
  };

  return (
    <div className="flex flex-col h-full items-center justify-center bg-[var(--color-bg-app)] text-[var(--color-text-primary)] px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] mb-4 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
            <Bot size={32} className="text-[var(--color-accent)]" />
          </div>
          <h1 className="text-xl font-bold text-center">
            Para reportar un incidente, primero {mode === 'login' ? 'inicia sesión' : 'regístrate'}
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1 text-center">
            Así podemos asociar tu reporte a tu cuenta y darte seguimiento.
          </p>
        </div>

        <div className="flex mb-4 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-1">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'login' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)]'}`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'register' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)]'}`}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6">
          <div className="relative">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Usuario"
              autoComplete="username"
              disabled={status === 'loading'}
              className="w-full bg-[var(--color-bg-app)] text-[var(--color-text-primary)] pl-10 pr-4 py-3 rounded-xl border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
            />
          </div>

          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              disabled={status === 'loading'}
              className="w-full bg-[var(--color-bg-app)] text-[var(--color-text-primary)] pl-10 pr-4 py-3 rounded-xl border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!username.trim() || !password || status === 'loading'}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-bold rounded-xl hover:bg-[var(--color-accent-light)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {status === 'loading'
              ? <Loader2 size={18} className="animate-spin" />
              : (mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta')}
          </button>
        </form>
      </div>
    </div>
  );
}
