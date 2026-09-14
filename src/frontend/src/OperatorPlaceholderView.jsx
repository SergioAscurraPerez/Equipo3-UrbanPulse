import { Activity, ShieldAlert } from 'lucide-react';

export default function OperatorPlaceholderView({ titulo, descripcion }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in bg-[var(--color-bg-app)]">
      <div className="p-4 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] mb-6 shadow-[0_0_30px_rgba(168,85,247,0.15)] text-[var(--color-accent)]">
        <ShieldAlert size={48} />
      </div>
      <h1 className="text-3xl font-bold mb-3 tracking-tight text-[var(--color-text-primary)]">
        {titulo}
      </h1>
      <p className="text-[var(--color-text-secondary)] max-w-md text-base leading-relaxed mb-6">
        {descripcion || 'Módulo exclusivo para operadores autorizados de la municipalidad.'}
      </p>
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] text-xs text-[var(--color-accent)]">
        <Activity size={14} className="animate-pulse" />
        <span>Panel Operativo Conectado</span>
      </div>
    </div>
  );
}