// HU-11 T04 - Pruebas unitarias de la tarjeta del modelo.
// Ubicacion: mf-panel-riesgo/src/components/TarjetaModelo.test.jsx (junto a TarjetaModelo.jsx)
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import TarjetaModelo from './TarjetaModelo';

// Vitest sin "globals" no limpia el DOM solo: se desmonta la tarjeta tras cada prueba
afterEach(() => cleanup());

const base = {
  version: 'riesgo_vial@4',
  entrenado: '2026-10-13',
  sesgo_ok: null,
  monitoreo: { fecha: '2026-10-26', deriva: false },
};

describe('TarjetaModelo (HU-11 T04)', () => {
  it('muestra la etiqueta F1-macro (validación temporal)', () => {
    render(<TarjetaModelo modelo={{ ...base, f1_macro: 0.332 }} />);
    expect(screen.getByText('F1-macro (validación temporal)')).toBeTruthy();
  });

  it('muestra el F1-macro con 3 decimales, igual que MLflow', () => {
    render(<TarjetaModelo modelo={{ ...base, f1_macro: 0.332 }} />);
    expect(screen.getByTestId('f1-macro').textContent).toBe('0.332');
  });

  it('acepta el valor como texto ("0.332")', () => {
    render(<TarjetaModelo modelo={{ ...base, f1_macro: '0.332' }} />);
    expect(screen.getByTestId('f1-macro').textContent).toBe('0.332');
  });

  it('muestra "Pendiente" si f1_macro llega null', () => {
    render(<TarjetaModelo modelo={{ ...base, f1_macro: null }} />);
    expect(screen.getByTestId('f1-macro').textContent).toContain('Pendiente');
  });

  it('usa la etiqueta que manda el backend en modelo.metrica', () => {
    render(<TarjetaModelo modelo={{ ...base, metrica: 'F1-macro', f1_macro: 0.332 }} />);
    expect(screen.getByText('F1-macro')).toBeTruthy();
  });
});
