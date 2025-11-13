import React, { useState, useEffect } from 'react';
import DeliveryForm from './components/DeliveryForm';
import ResultsPage from './components/ResultsPage';
import HistoryPage from './components/HistoryPage';
import { type CalculationResult, type Address, type View, type Delivery } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<View>('form');
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([
    { id: 1, value: '' },
    { id: 2, value: '' },
  ]);
  const [applicantName, setApplicantName] = useState<string>('');
  const [includeReturn, setIncludeReturn] = useState<boolean>(false);
  const [deliveryHistory, setDeliveryHistory] = useState<Delivery[]>([]);

  // Load history from localStorage on initial render
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('deliveryHistory');
      if (storedHistory) {
        setDeliveryHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to load delivery history from localStorage", error);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('deliveryHistory', JSON.stringify(deliveryHistory));
    } catch (error) {
      console.error("Failed to save delivery history to localStorage", error);
    }
  }, [deliveryHistory]);


  const handleCalculationSuccess = (result: CalculationResult, name: string, addresses: Address[], returnTrip: boolean) => {
    setCalculationResult(result);
    setApplicantName(name);
    setAddresses(addresses);
    setIncludeReturn(returnTrip);
    setView('results');
  };
  
  const handleNewRequest = () => {
    setCalculationResult(null);
    setAddresses([
      { id: 1, value: '' },
      { id: 2, value: '' },
    ]);
    setApplicantName('');
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
      applicantName,
      addresses,
      includeReturn,
      timestamp: Date.now(),
    };

    setDeliveryHistory(prev => [newDelivery, ...prev]);

    const addressList = addresses.map((addr, index) => `  Ponto ${index + 1}: ${addr.value}`).join('\n');
    const returnText = includeReturn ? "\n- Retorno ao ponto 1: Sim" : "";
    const message = `
Olá, gostaria de solicitar um serviço de entrega.
*ID do Pedido:* ${newDelivery.id}
*Solicitante:* ${applicantName}
*Endereços:*
${addressList}${returnText}
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
        return <DeliveryForm onCalculationSuccess={handleCalculationSuccess} initialData={{ applicantName, addresses, includeReturn }} />;
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
        return <DeliveryForm onCalculationSuccess={handleCalculationSuccess} initialData={{ applicantName, addresses, includeReturn }} />;
    }
  };
  
  const activeDeliveriesCount = deliveryHistory.filter(d => d.status === 'pending').length;


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <header className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-blue-800">DELIVERYMASTER FORTALEZA</h1>
        <p className="text-slate-600 mt-2">Solicite suas entregas com agilidade e precisão.</p>
      </header>
      <main className="w-full max-w-2xl">
        {view === 'form' && (
            <div className="mb-4 text-right">
                <button
                    onClick={() => setView('history')}
                    className="bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-600 transition-colors text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400"
                >
                    Ver Entregas Solicitadas ({activeDeliveriesCount} ativas)
                </button>
            </div>
        )}
        {renderContent()}
      </main>
      <footer className="mt-8 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} DELIVERYMASTER FORTALEZA. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default App;