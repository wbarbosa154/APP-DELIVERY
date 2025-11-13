
import React from 'react';
import MapPinIcon from './icons/MapPinIcon';
import TrashIcon from './icons/TrashIcon';
import SwapIcon from './icons/SwapIcon';

interface AddressInputProps {
  id: number;
  index: number;
  value: string;
  onUpdate: (id: number, value: string) => void;
  onRemove: (id: number) => void;
  onSwap?: () => void;
  isRemovable: boolean;
}

const AddressInput: React.FC<AddressInputProps> = ({ id, index, value, onUpdate, onRemove, onSwap, isRemovable }) => {
  const placeholderText = index === 0 ? 'Ex: Av. Bezerra de Menezes, 1234' : `Próxima parada...`;
  const labelText = index === 0 ? 'Ponto de Coleta' : `Ponto de Entrega ${index + 1}`;

  return (
    <div className="space-y-1.5">
       <label htmlFor={`address-${id}`} className="block text-xs font-semibold uppercase tracking-wider text-slate-600">{labelText}</label>
      <div className="relative group flex items-center">
        <span className="absolute left-4 text-slate-400 pointer-events-none">
          <MapPinIcon />
        </span>
        <input
          id={`address-${id}`}
          type="text"
          value={value}
          onChange={(e) => onUpdate(id, e.target.value)}
          placeholder={placeholderText}
          aria-label={labelText}
          className="w-full pl-12 pr-24 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm hover:border-slate-400"
        />
        <div className="absolute right-2 flex items-center space-x-1.5">
          {onSwap && (
             <button
                type="button"
                onClick={onSwap}
                className="p-1.5 text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                aria-label="Trocar com Ponto 1"
            >
                <SwapIcon />
            </button>
          )}
          {isRemovable && (
            <button
              type="button"
              onClick={() => onRemove(id)}
              className="p-1.5 text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-100 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              aria-label={`Remover ${labelText}`}
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressInput;
