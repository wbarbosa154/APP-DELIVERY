import React, { useState } from 'react';
import { type CalculationResult } from '../types';
import MapPinIcon from './icons/MapPinIcon';

interface ResultsPageProps {
  result: CalculationResult;
  onBack: () => void;
  onConfirm: () => void;
}

type PaymentMethod = 'dinheiro' | 'pix';

const ResultsPage: React.FC<ResultsPageProps> = ({ result, onBack, onConfirm }) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');

  const handleRequestService = () => {
    // The logic to build the message and open WhatsApp is now in App.tsx
    // to centralize the creation of the delivery record.
    onConfirm();
  };
  
  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-blue-800">Cálculo da Entrega</h2>
        <p className="text-slate-500 mt-1">Confira os detalhes e confirme a solicitação.</p>
      </div>

      <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-6 space-y-4">
        <div className="text-center">
            <p className="text-sm font-medium text-slate-600">Valor Total Estimado</p>
            <p className="text-4xl font-bold text-emerald-500">R$ {result.preco_estimado.toFixed(2)}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-center border-t border-slate-200 pt-4">
            <div>
                <p className="text-sm text-slate-500">Distância Total</p>
                <p className="text-lg font-semibold text-slate-800">{result.distancia_km} km</p>
            </div>
            <div>
                <p className="text-sm text-slate-500">Tempo Estimado</p>
                <p className="text-lg font-semibold text-slate-800">{result.tempo_minutos} min</p>
            </div>
        </div>
      </div>
      
      <a 
        href={result.rota_mapa_url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-700 font-bold py-3 px-6 rounded-lg hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
      >
        <MapPinIcon />
        Visualizar Rota no Mapa
      </a>

      <div>
        <h3 className="text-md font-semibold text-slate-800 mb-3">Forma de Pagamento</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setPaymentMethod('dinheiro')}
            className={`py-3 px-4 text-center rounded-lg border transition-all duration-200 ${paymentMethod === 'dinheiro' ? 'border-blue-700 bg-blue-50 ring-2 ring-blue-200' : 'border-slate-300 bg-white hover:border-slate-400'}`}
          >
            Dinheiro
          </button>
          <button
            onClick={() => setPaymentMethod('pix')}
            className={`py-3 px-4 text-center rounded-lg border transition-all duration-200 ${paymentMethod === 'pix' ? 'border-blue-700 bg-blue-50 ring-2 ring-blue-200' : 'border-slate-300 bg-white hover:border-slate-400'}`}
          >
            PIX
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onBack}
          className="w-full bg-slate-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
        >
          Voltar
        </button>
        <button
          onClick={handleRequestService}
          className="w-full bg-emerald-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400"
        >
          Solicitar Serviço
        </button>
      </div>
    </div>
  );
};

export default ResultsPage;