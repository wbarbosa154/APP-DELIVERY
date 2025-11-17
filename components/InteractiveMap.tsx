import React, { useEffect, useRef } from 'react';
import { type Address } from '../types';

declare var L: any;

interface InteractiveMapProps {
  addresses: Address[];
  focusedAddressId: number | null;
  onSwapAddresses?: (draggedId: number, targetId: number) => void;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ addresses, focusedAddressId, onSwapAddresses }) => {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);

  // Inicializa o mapa uma única vez
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current).setView([-3.7319, -38.5267], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      mapRef.current = map;
    }
  }, []);

  // Atualiza marcadores e a visão do mapa
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // 1. Limpa marcadores e polylines anteriores
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current = [];
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    const validPoints = addresses
      .map((addr, index) => ({ ...addr, index }))
      .filter(addr => addr.coordinates);

    if (validPoints.length === 0) {
      map.setView([-3.7319, -38.5267], 13); // Reseta para a visão padrão de Fortaleza
      return;
    }

    // 2. Adiciona novos marcadores
    const markerBounds: any[] = [];
    validPoints.forEach(point => {
      const { lat, lng } = point.coordinates!;
      markerBounds.push([lat, lng]);

      const isFocused = point.id === focusedAddressId;
      const focusedClass = isFocused ? 'focused' : '';

      const markerIcon = L.divIcon({
        html: `<div class="custom-marker-pin ${focusedClass}"><span class="custom-marker-label">${point.index + 1}</span></div>`,
        className: 'leaflet-div-icon', // Classe base para resetar estilos
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([lat, lng], { 
        icon: markerIcon,
        draggable: true,
        autoPan: true
      }).addTo(map);
      
      // Armazena o ID do endereço no marcador para referência futura
      marker.addressId = point.id;
      
      marker.on('dragend', (event: any) => {
          if (!onSwapAddresses) return;

          const draggedMarker = event.target;
          const droppedLatLng = draggedMarker.getLatLng();

          let closestMarker: any = null;
          let minDistance = Infinity;

          // Encontra o marcador mais próximo do ponto de soltura
          markersRef.current.forEach(m => {
              if (m === draggedMarker) return;
              const distance = droppedLatLng.distanceTo(m.getLatLng());
              if (distance < minDistance) {
                  minDistance = distance;
                  closestMarker = m;
              }
          });

          // Usa um limiar em pixels para consistência entre diferentes níveis de zoom
          if (closestMarker) {
              const dropPoint = map.latLngToContainerPoint(droppedLatLng);
              const closestPoint = map.latLngToContainerPoint(closestMarker.getLatLng());
              const pixelDistance = dropPoint.distanceTo(closestPoint);
              const SWAP_THRESHOLD_PIXELS = 50;

              if (pixelDistance < SWAP_THRESHOLD_PIXELS) {
                  onSwapAddresses(draggedMarker.addressId, closestMarker.addressId);
              }
          }
          // A re-renderização do componente pai irá "snap" automaticamente o marcador
          // para sua nova posição correta com base no array de endereços atualizado.
      });

      if (point.value) {
        marker.bindTooltip(point.value, {
          offset: [0, -32],
          direction: 'top',
          permanent: false,
        });
      }
      
      markersRef.current.push(marker);
    });

    // Adiciona a linha da rota
    if (validPoints.length > 1) {
      const latLngs = validPoints.map(p => [p.coordinates!.lat, p.coordinates!.lng]);
      const polyline = L.polyline(latLngs, {
        color: '#ef4444', // red-500
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
      }).addTo(map);
      polylineRef.current = polyline;
    }

    // 3. Lógica de foco/zoom com animação
    const zoomPanOptions = { animate: true, duration: 0.75 };
    const focusedPoint = validPoints.find(p => p.id === focusedAddressId);

    if (focusedPoint && focusedPoint.coordinates) {
      map.setView([focusedPoint.coordinates.lat, focusedPoint.coordinates.lng], 16, zoomPanOptions);
    } else if (markerBounds.length > 0) {
      map.fitBounds(markerBounds, { padding: [50, 50], maxZoom: 16, ...zoomPanOptions });
    }
  }, [addresses, focusedAddressId, onSwapAddresses]);

  return (
    <div className="h-full w-full rounded-lg overflow-hidden shadow-md border border-slate-200">
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
};

export default InteractiveMap;