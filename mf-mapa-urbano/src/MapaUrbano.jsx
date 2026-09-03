import { useEffect, useRef } from 'react';
import tt from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';
import './index.css';
import MapLegend from './MapLegend';
import { INCIDENT_COLORS } from './incidentColors';

// Fallback si TE_N8N_REPORTS_LIST_URL no está configurada en el entorno de despliegue
const N8N_REPORTS_LIST_URL = 'https://urbanpulse-n8n.xq33kajky1yy6.us-east-1.cs.amazonlightsail.com/webhook/urbanpulse/reports-list';

const MapaUrbano = ({ lat, lon }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);

  // Efecto 1: Inicializar el mapa la primera vez
  useEffect(() => {
    // Creamos la instancia del mapa
    const mapInstance = tt.map({
      key: import.meta.env.VITE_TOMTOM_API_KEY,
      container: mapContainer.current,
      center: [-77.0428, -12.0464],
      zoom: 12,
    });

    map.current = mapInstance;

    //Esta función se ejecuta cuando React desmonta el componente
    return () => {
      mapInstance.remove(); // Apagamos el motor 3D del mapa
      map.current = null;   // Vaciamos la referencia
    };
  }, []);

  // Efecto 2: Mover el mapa y poner el marcador
  useEffect(() => {
    if (map.current && lat && lon) {
      const lngLat = [parseFloat(lon), parseFloat(lat)];

      map.current.flyTo({
        center: lngLat,
        zoom: 16,
        speed: 2
      });

      if (marker.current) {
        marker.current.remove();
      }

      marker.current = new tt.Marker()
        .setLngLat(lngLat)
        .addTo(map.current);
    }
  }, [lat, lon]);

  // Efecto 3: Cargar todos los reportes históricos para mostrarlos en el mapa, coloreados por tipo
  useEffect(() => {
    const fetchReportesUrbanos = async () => {
      try {
        const webhookUrl = import.meta.env.TE_N8N_REPORTS_LIST_URL || N8N_REPORTS_LIST_URL;

        const response = await fetch(webhookUrl);
        const data = await response.json();

        // n8n (responseMode: lastNode) devuelve un objeto suelto cuando hay un
        // único reporte, y un array cuando hay varios. Normalizamos para que
        // .forEach funcione en los tres casos: 0, 1 o N reportes.
        const reportes = Array.isArray(data) ? data : (data && data.id ? [data] : []);

        reportes.forEach(reporte => {
          if (reporte.latitude && reporte.longitude) {
            new tt.Marker({ color: INCIDENT_COLORS[reporte.incident_type] || INCIDENT_COLORS.otro })
              .setLngLat([parseFloat(reporte.longitude), parseFloat(reporte.latitude)])
              .addTo(map.current);
          }
        });
      } catch (error) {
        console.error("Error cargando el mapa de calor/reportes:", error);
      }
    };

    if (map.current) {
      fetchReportesUrbanos();
    }
  }, []); // Array vacío para que el linter no lance la advertencia de refs

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }}></div>
      <MapLegend colors={INCIDENT_COLORS} />
    </div>
  );
};

export default MapaUrbano;
