export interface Address {
  id: number;
  value: string;
  coordinates?: Coordinates | null;
  complement: string;
  instructions: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface CalculationResult {
  distancia_km: number;
  tempo_minutos: number;

  preco_estimado: number;
  rota_mapa_url: string;
}

export type DeliveryStatus = 'pending' | 'completed' | 'cancelled';

export interface Delivery {
  id: string;
  status: DeliveryStatus;
  result: CalculationResult;
  addresses: Address[];
  timestamp: number;
  includeReturn: boolean;
}

export type View = 'form' | 'results' | 'history';
