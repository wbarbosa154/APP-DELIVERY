import React, { useState, useEffect } from 'react';
import { type Address, type CalculationResult } from '../types';
import { calculateDelivery, geocodeAddresses } from '../services/geminiService';
import InteractiveMap from './InteractiveMap';
import MapPinIcon from './icons/MapPinIcon';
import TrashIcon from './icons/TrashIcon';
import SearchIcon from './icons/SearchIcon';

interface DeliveryFormProps {
  onCalculationSuccess: (result: CalculationResult, addresses: Address[], includeReturn: boolean) => void;
  initialData?: {
    addresses: Address[];
    includeReturn?: boolean;
  }
}

const DeliveryForm: React.FC<DeliveryFormProps> = ({ onCalculationSuccess, initialData }) => {
  const [scheduleType, setScheduleType] = useState<'now' | 'schedule'>('now');
  const [addresses, setAddresses] = useState<Address[]>(initialData?.addresses || [
    { id: 1, value: '', complement: '', instructions: '' },
    { id: 2, value: '', complement: '', instructions: '' },
  ]);
  const [orderNumber, setOrderNumber] = useState('');
  const [includeReturn, setIncludeReturn] = useState(initialData?.includeReturn || false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedAddressId, setFocusedAddressId] = useState<number | null>(null);

  useEffect(() => {
    if (initialData) {
        setAddresses(initialData.addresses.map(addr => ({ ...addr, coordinates: null })));
        setIncludeReturn(initialData.includeReturn || false);
    }
  }, [initialData]);

  // Efeito para geocodificar endereços com debounce
  useEffect(() => {
    const handler = setTimeout(async () => {
      const addressesToGeocode = addresses.filter(addr => addr.value.trim() !== '' && !addr.coordinates);
      
      if (addressesToGeocode.length === 0) {
        return;
      }

      setIsGeocoding(true);
      try {
        const geocodedResults = await geocodeAddresses(addressesToGeocode.map(a => a.value));
        
        setAddresses(currentAddresses => {
          const updatedAddresses = [...currentAddresses];
          addressesToGeocode.forEach((addrToUpdate, index) => {
            const masterIndex = updatedAddresses.findIndex(a => a.id === addrToUpdate.id);
            if (masterIndex !== -1) {
              updatedAddresses[masterIndex].coordinates = geocodedResults[index] || null;
            }
          });
          return updatedAddresses;
        });
      } catch (e) {
        console.error("A geocodificação em lote falhou", e);
      } finally {
        setIsGeocoding(false);
      }
    }, 1000); // debounce de 1 segundo

    return () => {
      clearTimeout(handler);
    };
  }, [JSON.stringify(addresses.map(a => a.value))]);


  const updateAddressField = (id: number, field: keyof Omit<Address, 'id' | 'coordinates'>, value: string) => {
    const isAddressValue = field === 'value';
    setAddresses(prev => 
      prev.map(addr => 
        addr.id === id 
          ? { ...addr, [field]: value, coordinates: isAddressValue ? null : addr.coordinates } 
          : addr
      )
    );
  };
  
  const handleGeocodeAddress = async (id: number) => {
    const addressToGeocode = addresses.find(addr => addr.id === id);
    if (!addressToGeocode || !addressToGeocode.value.trim()) {
      return;
    }
    
    // If coordinates already exist, just focus the map.
    if (addressToGeocode.coordinates) {
      setFocusedAddressId(id);
      return;
    }

    setIsGeocoding(true);
    setError(null);
    try {
        const [geocodedResult] = await geocodeAddresses([addressToGeocode.value]);
        
        setAddresses(currentAddresses => 
            currentAddresses.map(addr => 
                addr.id === id 
                ? { ...addr, coordinates: geocodedResult || null } 
                : addr
            )
        );
        
        if (!geocodedResult) {
            setError(`Não foi possível localizar o endereço do Ponto ${addresses.findIndex(a => a.id === id) + 1}. Verifique e tente novamente.`);
        }

        setFocusedAddressId(id);
    } catch (e) {
        console.error("A geocodificação manual falhou", e);
        setError("Ocorreu um erro ao buscar o endereço no mapa.");
    } finally {
        setIsGeocoding(false);
    }
  };

  const addAddress = () => {
    setAddresses(prev => [...prev, { id: Date.now(), value: '', complement: '', instructions: '' }]);
  };

  const removeAddress = (id: number) => {
    setAddresses(prev => prev.filter(addr => addr.id !== id));
  };
  
  const handleSwapAddresses = (addressId1: number, addressId2: number) => {
    setAddresses(prev => {
        const newAddresses = [...prev];
        const index1 = newAddresses.findIndex(a => a.id === addressId1);
        const index2 = newAddresses.findIndex(a => a.id === addressId2);

        if (index1 === -1 || index2 === -1) {
            return prev;
        }
        
        // Swap the elements at the found indices
        [newAddresses[index1], newAddresses[index2]] = [newAddresses[index2], newAddresses[index1]];

        return newAddresses;
    });
  };

  const handleCalculate = async () => {
    setError(null);
    const invalidAddress = addresses.find(addr => !addr.value.trim());
    if (invalidAddress) {
        setError(`O endereço do Ponto ${addresses.indexOf(invalidAddress) + 1} é obrigatório.`);
        return;
    }
    
    setIsLoading(true);
    try {
      const result = await calculateDelivery(addresses, orderNumber, includeReturn, scheduleType);
      onCalculationSuccess(result, addresses, includeReturn);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-8">
            {/* Coluna do Formulário */}
            <div className="space-y-6 flex flex-col">
                <div className="flex items-center space-x-6">
                    <label className="flex items-center space-x-2 text-md font-semibold cursor-pointer">
                        <input type="radio" name="scheduleType" value="now" checked={scheduleType === 'now'} onChange={() => setScheduleType('now')} className="h-4 w-4 accent-red-500"/>
                        <span className={scheduleType === 'now' ? 'text-red-500' : 'text-slate-600'}>Executar agora</span>
                    </label>
                    <label className="flex items-center space-x-2 text-md font-semibold cursor-pointer">
                        <input type="radio" name="scheduleType" value="schedule" checked={scheduleType === 'schedule'} onChange={() => setScheduleType('schedule')} className="h-4 w-4 accent-red-500"/>
                        <span className={scheduleType === 'schedule' ? 'text-red-500' : 'text-slate-600'}>Agendar</span>
                    </label>
                </div>
                
                <div className="space-y-4 relative">
                    {addresses.map((addr, index) => (
                        <div key={addr.id} className="border border-red-300 rounded-md p-4 space-y-3 relative">
                            {addresses.length > 2 && (
                                <button
                                    onClick={() => removeAddress(addr.id)}
                                    className="absolute -top-2 -right-2 bg-white p-0.5 rounded-full border border-red-300 text-red-400 hover:text-red-600 hover:scale-110 transition-transform"
                                    aria-label="Remover Ponto"
                                >
                                    <TrashIcon />
                                </button>
                            )}
                            <div className="flex items-center space-x-2">
                                <MapPinIcon className="h-6 w-6 text-red-500" />
                                <span className="font-semibold text-slate-700">Ponto {index + 1}</span>
                            </div>
                            <div className="flex space-x-2">
                                <div className="relative w-full flex">
                                    <input
                                      type="text"
                                      value={addr.value}
                                      onFocus={() => setFocusedAddressId(addr.id)}
                                      onChange={(e) => updateAddressField(addr.id, 'value', e.target.value)}
                                      placeholder="Digite o endereço"
                                      className="w-full pl-3 pr-10 py-2 border border-red-300 rounded-l-md focus:ring-red-500 focus:border-red-500 transition"
                                    />
                                    <button 
                                      className="flex items-center justify-center px-3 bg-cyan-500 text-white rounded-r-md hover:bg-cyan-600 transition-colors"
                                      onClick={() => handleGeocodeAddress(addr.id)}
                                      aria-label="Procurar endereço no mapa"
                                    >
                                        <SearchIcon className="h-5 w-5"/>
                                    </button>
                                </div>
                                <input
                                  type="text"
                                  value={addr.complement}
                                  onChange={(e) => updateAddressField(addr.id, 'complement', e.target.value)}
                                  placeholder="Comp."
                                  className="w-1/3 px-3 py-2 border border-red-300 rounded-md focus:ring-red-500 focus:border-red-500 transition"
                                />
                            </div>
                            {addr.value.trim() === '' && <p className="text-red-500 text-xs">Endereço obrigatório</p>}
                            <div>
                                <label className="text-xs text-slate-500">Procurar por:</label>
                                <textarea
                                  value={addr.instructions}
                                  onChange={(e) => updateAddressField(addr.id, 'instructions', e.target.value)}
                                  placeholder="Favor informar o que fazer"
                                  rows={2}
                                  className="w-full mt-1 px-3 py-2 border border-red-300 rounded-md focus:ring-red-500 focus:border-red-500 transition"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div>
                    <label htmlFor="orderNumber" className="block text-sm font-medium text-slate-700">Nº NF ou Pedido:</label>
                    <input
                      id="orderNumber"
                      type="text"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="Número nota"
                      className="w-full mt-1 px-4 py-2 border border-red-300 rounded-md focus:ring-red-500 focus:border-red-500 transition"
                    />
                </div>
                
                <button
                    onClick={addAddress}
                    className="text-sm font-semibold text-red-600 hover:text-red-800 transition self-start"
                >
                    + Incluir endereço
                </button>
                
                <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm cursor-pointer">
                        <input type="radio" name="return" checked={includeReturn} onChange={() => setIncludeReturn(true)} className="h-4 w-4 accent-red-500"/>
                        <span className={includeReturn ? 'text-slate-800 font-semibold' : 'text-slate-600'}>Incluir retorno ao ponto 1</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm cursor-pointer">
                        <input type="radio" name="return" checked={!includeReturn} onChange={() => setIncludeReturn(false)} className="h-4 w-4 accent-red-500"/>
                        <span className={!includeReturn ? 'text-slate-800 font-semibold' : 'text-slate-600'}>Sem retorno</span>
                    </label>
                </div>


                {error && <p className="text-red-600 text-sm text-center font-semibold">{error}</p>}
                
                <button
                    onClick={handleCalculate}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-b from-red-500 to-red-600 text-white font-bold py-3 px-6 rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                      'Calcular Serviço'
                    )}
                </button>
            </div>

            {/* Coluna do Mapa */}
            <div className="relative mt-6 md:mt-0 min-h-[300px] md:min-h-full">
                <InteractiveMap 
                  addresses={addresses} 
                  focusedAddressId={focusedAddressId}
                  onSwapAddresses={handleSwapAddresses}
                />
                {isGeocoding && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                        <div className="flex items-center gap-2 text-slate-600 font-semibold">
                             <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                             </svg>
                            Atualizando mapa...
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default DeliveryForm;