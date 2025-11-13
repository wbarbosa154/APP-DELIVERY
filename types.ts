export interface Address {
  id: number;
  value: string;
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
  applicantName: string;
  addresses: Address[];
  includeReturn: boolean;
  timestamp: number;
}

export type View = 'form' | 'results' | 'history';