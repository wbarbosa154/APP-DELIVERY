
import React, { useState, useEffect } from 'react';
import DeliveryForm from './components/DeliveryForm';
import ResultsPage from './components/ResultsPage';
import HistoryPage from './components/HistoryPage';
import { type CalculationResult, type Address, type View, type Delivery } from './types';
import { db } from './services/db';

const App: React.FC = () => {
  const [view, setView] = useState<View>('form');
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([
    { id: 1, value: '', complement: '', instructions: '' },
    { id: 2, value: '', complement: '', instructions: '' },
  ]);
  const [includeReturn, setIncludeReturn] = useState(false);
  const [deliveryHistory, setDeliveryHistory] = useState<Delivery[]>(() => db.getDeliveryHistory());

  useEffect(() => {
    db.saveDeliveryHistory(deliveryHistory);
  }, [deliveryHistory]);

  const handleCalculationSuccess = (result: CalculationResult, addresses: Address[], includeReturn: boolean) => {
    setCalculationResult(result);
    setAddresses(addresses);
    setIncludeReturn(includeReturn);
    setView('results');
  };
  
  const handleNewRequest = () => {
    setCalculationResult(null);
    setAddresses([
      { id: 1, value: '', complement: '', instructions: '' },
      { id: 2, value: '', complement: '', instructions: '' },
    ]);
    setIncludeReturn(false);
    setView('form');
  };

  const handleGoBackToForm = () => {
    setView('form');
  };

  const handleConfirmRequest = () => {
    if (!calculationResult) return;

    const newDelivery: Delivery = {
      id: `entrega-${Date.now()}`,
      status: 'pending',
      result: calculationResult,
      addresses,
      timestamp: Date.now(),
      includeReturn,
    };

    setDeliveryHistory(prev => [newDelivery, ...prev]);

    const addressList = addresses.map((addr, index) => `  Ponto ${index + 1}: ${addr.value} ${addr.complement}`).join('\n');
    const message = `
Olá, gostaria de solicitar um serviço de entrega.
*ID do Pedido:* ${newDelivery.id}
*Endereços:*
${addressList}
*Retorno ao Ponto 1:* ${includeReturn ? 'Sim' : 'Não'}
*Valor Estimado:* R$ ${calculationResult.preco_estimado.toFixed(2)}
*Distância:* ${calculationResult.distancia_km} km
*Forma de Pagamento:* PIX
*Ver Rota:* ${calculationResult.rota_mapa_url}
`.trim();
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/5585987789135?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    setView('history');
  };
  
  const handleCancelDelivery = (id: string) => {
    setDeliveryHistory(prev => prev.map(d => d.id === id ? { ...d, status: 'cancelled' } : d));
  };


  const renderContent = () => {
    switch (view) {
      case 'form':
        return <DeliveryForm onCalculationSuccess={handleCalculationSuccess} initialData={{ addresses, includeReturn }} />;
      case 'results':
        if (!calculationResult) {
            setView('form'); // Fallback if result is missing
            return null;
        }
        return (
          <ResultsPage
            result={calculationResult}
            onBack={handleGoBackToForm}
            onConfirm={handleConfirmRequest}
          />
        );
      case 'history':
        return <HistoryPage deliveries={deliveryHistory} onCancel={handleCancelDelivery} onNewRequest={handleNewRequest} onBack={handleNewRequest} />;
      default:
        return <DeliveryForm onCalculationSuccess={handleCalculationSuccess} initialData={{ addresses, includeReturn }} />;
    }
  };
  
  const activeDeliveriesCount = deliveryHistory.filter(d => d.status === 'pending').length;


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl">
        <header className="flex justify-between items-center mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-red-600">
                DELIVERY<span className="text-slate-800">MASTER</span>
            </h1>
            <button
                onClick={() => setView('history')}
                className="relative flex items-center gap-2 px-4 py-2 border border-red-400 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors"
            >
                Minha página
                {activeDeliveriesCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                    {activeDeliveriesCount}
                </span>
                )}
            </button>
        </header>
        <main>
          {renderContent()}
        </main>
      </div>
      <footer className="mt-8 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} DELIVERYMASTER FORTALEZA. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default App;
