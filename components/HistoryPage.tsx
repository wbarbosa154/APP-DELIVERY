import React from 'react';
import { type Delivery } from '../types';
import TrashIcon from './icons/TrashIcon';

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
    const { status, applicantName, timestamp, result, addresses } = delivery;
    const style = statusStyles[status];
    const date = new Date(timestamp);
    
    return (
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-in-out space-y-3">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-slate-800">{applicantName}</p>
                    <p className="text-xs text-slate-500">{date.toLocaleDateString('pt-BR')} às {date.toLocaleTimeString('pt-BR')}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${style.bg} ${style.text}`}>
                    {style.label}
                </span>
            </div>
            <div className="border-t border-slate-200 pt-3 space-y-1 text-sm text-slate-600">
                <p><strong>Destinos:</strong> {addresses.length} pontos</p>
                <p><strong>Distância:</strong> {result.distancia_km} km</p>
                <p><strong>Valor:</strong> <span className="font-bold text-slate-800">R$ {result.preco_estimado.toFixed(2)}</span></p>
            </div>
            {status === 'pending' && (
                <div className="border-t border-slate-200 pt-3 flex justify-end">
                    <button 
                        onClick={() => onCancel(delivery.id)}
                        className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-800 transition-colors"
                    >
                        <TrashIcon />
                        Cancelar
                    </button>
                </div>
            )}
        </div>
    );
};


const HistoryPage: React.FC<HistoryPageProps> = ({ deliveries, onCancel, onNewRequest, onBack }) => {
  const activeDeliveries = deliveries.filter(d => d.status === 'pending');
  const pastDeliveries = deliveries.filter(d => d.status !== 'pending');

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-blue-800">Entregas Solicitadas</h2>
        <p className="text-slate-500 mt-1">Acompanhe suas solicitações ativas e veja seu histórico.</p>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Entregas Ativas</h3>
        {activeDeliveries.length > 0 ? (
            <div className="space-y-3">
                {activeDeliveries.map(d => <DeliveryItem key={d.id} delivery={d} onCancel={onCancel} />)}
            </div>
        ) : (
            <p className="text-slate-500 text-sm text-center py-4">Nenhuma entrega ativa no momento.</p>
        )}
      </div>

       <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Histórico</h3>
        {pastDeliveries.length > 0 ? (
            <div className="space-y-3">
                {pastDeliveries.map(d => <DeliveryItem key={d.id} delivery={d} onCancel={onCancel} />)}
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
  );
};

export default HistoryPage;