import React, { useState, useEffect } from 'react';
import { type Address, type CalculationResult } from '../types';
import { calculateDelivery } from '../services/geminiService';
import AddressInput from './AddressInput';
import PlusIcon from './icons/PlusIcon';
import RouteIcon from './icons/RouteIcon';

interface DeliveryFormProps {
  onCalculationSuccess: (result: CalculationResult, name: string, addresses: Address[], returnTrip: boolean) => void;
  initialData?: {
    applicantName: string;
    addresses: Address[];
    includeReturn: boolean;
  }
}

const DeliveryForm: React.FC<DeliveryFormProps> = ({ onCalculationSuccess, initialData }) => {
  const [applicantName, setApplicantName] = useState(initialData?.applicantName || '');
  const [addresses, setAddresses] = useState<Address[]>(initialData?.addresses || [
    { id: 1, value: '' },
    { id: 2, value: '' },
  ]);
  const [includeReturn, setIncludeReturn] = useState(initialData?.includeReturn || false);
  const [organizeRoute, setOrganizeRoute] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
        setApplicantName(initialData.applicantName);
        setAddresses(initialData.addresses);
        setIncludeReturn(initialData.includeReturn);
    }
  }, [initialData]);

  const updateAddress = (id: number, value: string) => {
    setAddresses(prev => prev.map(addr => (addr.id === id ? { ...addr, value } : addr)));
  };

  const addAddress = () => {
    setAddresses(prev => [...prev, { id: Date.now(), value: '' }]);
  };

  const removeAddress = (id: number) => {
    setAddresses(prev => prev.filter(addr => addr.id !== id));
  };

  const swapAddresses = () => {
    if (addresses.length >= 2) {
        setAddresses(prev => {
            const newAddresses = [...prev];
            const temp = newAddresses[0];
            newAddresses[0] = newAddresses[1];
            newAddresses[1] = temp;
            return newAddresses;
        });
    }
  };

  const handleCalculate = async () => {
    setError(null);
    if (!applicantName.trim() || addresses.some(addr => !addr.value.trim())) {
      setError('Por favor, preencha o seu nome e todos os campos de endereço.');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await calculateDelivery(addresses, includeReturn, organizeRoute);
      onCalculationSuccess(result, applicantName, addresses, includeReturn);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };

  const canAddAddress = addresses.length > 1 && addresses[1].value.trim() !== '';

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 space-y-6 animate-fade-in">
      <div className="space-y-2">
        <label htmlFor="applicantName" className="block text-sm font-medium text-slate-700">Seu Nome</label>
        <input
          id="applicantName"
          type="text"
          value={applicantName}
          onChange={(e) => setApplicantName(e.target.value)}
          placeholder="Nome do solicitante"
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition"
        />
      </div>
      
      <div className="space-y-4">
        {addresses.map((addr, index) => (
          <AddressInput
            key={addr.id}
            id={addr.id}
            index={index}
            value={addr.value}
            onUpdate={updateAddress}
            onRemove={removeAddress}
            onSwap={index === 1 ? swapAddresses : undefined}
            isRemovable={addresses.length > 2}
          />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {canAddAddress && (
          <button
            onClick={addAddress}
            className="flex items-center justify-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900 transition"
          >
            <PlusIcon />
            Incluir Novo Endereço
          </button>
        )}
        {addresses.length >= 3 && (
          <div className="flex items-center">
            <input
              id="organizeRoute"
              type="checkbox"
              checked={organizeRoute}
              onChange={(e) => setOrganizeRoute(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="organizeRoute" className="ml-2 block text-sm text-slate-700">
              Organizar por menor rota
            </label>
          </div>
        )}
      </div>

      <div className="flex items-center">
        <input
          id="includeReturn"
          type="checkbox"
          checked={includeReturn}
          onChange={(e) => setIncludeReturn(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="includeReturn" className="ml-2 block text-sm text-slate-700">
          Incluir retorno ao Ponto 1
        </label>
      </div>
      
      <div className="border-t border-slate-200 pt-4">
        <p className="text-sm text-slate-500 text-center">
            Prévia do valor: <span className="font-semibold text-slate-700">R$ 7,00 por entrega</span>. O valor final será calculado.
        </p>
      </div>

      {error && <p className="text-red-600 text-sm text-center">{error}</p>}

      <button
        onClick={handleCalculate}
        disabled={isLoading}
        className="w-full bg-blue-800 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-900 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Calculando...
          </>
        ) : (
          <>
            <RouteIcon />
            Calcular Serviço
          </>
        )}
      </button>
    </div>
  );
};

export default DeliveryForm;