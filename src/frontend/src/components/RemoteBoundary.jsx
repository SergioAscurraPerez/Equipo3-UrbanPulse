import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class RemoteBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[RemoteBoundary] Error en el microfrontend ${this.props.nombre}:`, error, errorInfo);
  }

  handleReintentar = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full p-6 text-center animate-fade-in bg-[var(--color-card)] rounded-2xl border border-red-500/30">
          <div className="p-4 bg-red-500/10 rounded-full mb-4">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
          <h3 className="text-lg font-bold mb-2 text-[var(--color-text-primary)]">
            Módulo no disponible
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-md">
            No se pudo cargar el microfrontend <span className="font-mono text-[var(--color-accent)]">{this.props.nombre}</span>. El servidor remoto podría estar apagado o en mantenimiento.
          </p>
          <button
            onClick={this.handleReintentar}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--color-panel)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-red-400 hover:text-red-400 transition-colors"
          >
            <RefreshCw size={16} />
            <span className="font-medium text-sm">Reintentar conexión</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RemoteBoundary;