import { type Delivery } from '../types';

const HISTORY_KEY = 'deliveryHistory';

/**
 * Este serviço simula um banco de dados usando o localStorage do navegador.
 * Em um ambiente de produção, essas funções seriam substituídas por chamadas de API
 * para um banco de dados real no backend.
 */
export const db = {
  /**
   * Carrega o histórico de entregas do localStorage.
   * @returns {Delivery[]} Uma lista de registros de entrega.
   */
  getDeliveryHistory: (): Delivery[] => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      if (storedHistory) {
        return JSON.parse(storedHistory);
      }
    } catch (error) {
      console.error("Falha ao carregar o histórico de entregas do localStorage", error);
    }
    return [];
  },

  /**
   * Salva todo o histórico de entregas no localStorage.
   * @param {Delivery[]} deliveries - A lista de registros de entrega para salvar.
   */
  saveDeliveryHistory: (deliveries: Delivery[]): void => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(deliveries));
    } catch (error) {
      console.error("Falha ao salvar o histórico de entregas no localStorage", error);
    }
  },
};
