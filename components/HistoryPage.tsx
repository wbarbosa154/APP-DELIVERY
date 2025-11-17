import React, { useState } from 'react';
import { type Delivery } from '../types';
import TrashIcon from './icons/TrashIcon';
import MapPinIcon from './icons/MapPinIcon';
import DistanceIcon from './icons/DistanceIcon';
import CashIcon from './icons/CashIcon';

interface HistoryPageProps {
  deliveries: Delivery[];
  onCancel: (id: string) => void;
  onNewRequest: () => void;
  onBack: () => void;
}

const statusStyles = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente' },
    completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Concluído' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelado' },
};

const DeliveryItem: React.FC<{ delivery: Delivery; onCancel: (id: string) => void; }> = ({ delivery, onCancel }) => {
    const { status, timestamp, result, addresses, id, includeReturn } = delivery;
    const style = statusStyles[status];
    const date = new Date(timestamp);
    const formattedDate = `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    
    return (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-in-out space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <p className="font-bold text-lg text-slate-900">Pedido de Entrega</p>
                    <p className="text-xs text-slate-500">ID: {id.slice(-6).toUpperCase()} &bull; {formattedDate}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${style.bg} ${style.text}`}>
                    {style.label}
                </span>
            </div>
            
            {/* Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-t border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-600 p-2.5 rounded-full">
                        <MapPinIcon />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Destinos</p>
                        <p className="font-semibold text-slate-800">{addresses.length} pontos</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <div className="bg-purple-100 text-purple-600 p-2.5 rounded-full">
                        <DistanceIcon />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Distância</p>
                        <p className="font-semibold text-slate-800">{result.distancia_km} km</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-green-100 text-green-600 p-2.5 rounded-full">
                        <CashIcon />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Valor</p>
                        <p className="font-bold text-green-600">R$ {result.preco_estimado.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Address List */}
            <div>
                <ol className="space-y-3">
                    {addresses.map((address, index) => (
                        <li key={address.id} className="flex items-start text-sm">
                           <span className="bg-slate-200 text-slate-600 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center mr-3 mt-0.5 shrink-0">{index + 1}</span>
                           <div className="flex-1">
                               <p className="text-slate-800 font-medium leading-tight">{address.value}</p>
                           </div>
                        </li>
                    ))}
                    {includeReturn && (
                         <li className="flex items-start text-sm">
                           <span className="bg-slate-200 text-slate-600 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center mr-3 mt-0.5 shrink-0">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                             </svg>
                           </span>
                           <div className="flex-1">
                               <p className="text-slate-800 font-medium leading-tight">Retorno ao Ponto 1</p>
                           </div>
                        </li>
                    )}
                </ol>
            </div>


            {/* Footer Actions */}
            {status === 'pending' && (
                <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button 
                        onClick={() => onCancel(delivery.id)}
                        className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 py-2 px-4 rounded-lg transition-colors"
                    >
                        <TrashIcon />
                        Cancelar Entrega
                    </button>
                </div>
            )}
        </div>
    );
};


const HistoryPage: React.FC<HistoryPageProps> = ({ deliveries, onCancel, onNewRequest, onBack }) => {
  const [deliveryToCancel, setDeliveryToCancel] = useState<string | null>(null);
  
  const activeDeliveries = deliveries.filter(d => d.status === 'pending');
  const pastDeliveries = deliveries.filter(d => d.status !== 'pending');

  const handleConfirmCancel = () => {
    if (deliveryToCancel) {
      onCancel(deliveryToCancel);
      setDeliveryToCancel(null);
    }
  };

  const handleDialogClose = () => {
    setDeliveryToCancel(null);
  };

  return (
    <>
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 space-y-8 animate-fade-in">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-blue-800">Entregas Solicitadas</h2>
          <p className="text-slate-500 mt-1">Acompanhe suas solicitações ativas e veja seu histórico.</p>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Entregas Ativas</h3>
          {activeDeliveries.length > 0 ? (
              <div className="space-y-4">
                  {activeDeliveries.map(d => <DeliveryItem key={d.id} delivery={d} onCancel={setDeliveryToCancel} />)}
              </div>
          ) : (
              <p className="text-slate-500 text-sm text-center py-4">Nenhuma entrega ativa no momento.</p>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Histórico</h3>
          {pastDeliveries.length > 0 ? (
              <div className="space-y-4">
                  {pastDeliveries.map(d => <DeliveryItem key={d.id} delivery={d} onCancel={setDeliveryToCancel} />)}
              </div>
          ) : (
              <p className="text-slate-500 text-sm text-center py-4">Seu histórico de entregas está vazio.</p>
          )}
        </div>
        
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-4 border-t pt-6">
          <button
              onClick={onBack}
              className="w-full sm:w-auto bg-slate-100 text-slate-700 font-semibold py-3 px-6 rounded-lg hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
          >
              Voltar
          </button>
          <button
              onClick={onNewRequest}
              className="w-full sm:w-auto bg-blue-800 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-900 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
              Fazer Nova Solicitação
          </button>
      </div>
      </div>
      
      {deliveryToCancel && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in"
          aria-modal="true"
          role="dialog"
        >
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm m-4 p-6 text-center">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Confirm Cancellation</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to cancel this delivery?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleDialogClose}
                className="w-full bg-slate-200 text-slate-800 font-bold py-3 px-4 rounded-lg hover:bg-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCancel}
                className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HistoryPage;