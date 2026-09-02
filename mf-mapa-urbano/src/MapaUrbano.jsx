import { useEffect, useRef } from 'react';
import tt from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';

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

  // Efecto 3: Cargar todos los reportes históricos para mostrarlos en el mapa
  useEffect(() => {
    const fetchReportesUrbanos = async () => {
      try {
        // Validación de seguridad de la variable de entorno
        const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
        if (!webhookUrl) {
          console.error("Variable VITE_N8N_WEBHOOK_URL no configurada en el entorno.");
          return;
        }

        // Fetch corregido (sin el error de sintaxis)
        const response = await fetch(webhookUrl);
        const data = await response.json();
        
        // Aquí recorremos la data que viene de Postgres y ponemos marcadores masivos
        data.forEach(reporte => {
          if (reporte.latitude && reporte.longitude) {
            new tt.Marker()
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
    <div ref={mapContainer} style={{ width: '100%', height: '100%' }}></div>
  );
};

export default MapaUrbano;