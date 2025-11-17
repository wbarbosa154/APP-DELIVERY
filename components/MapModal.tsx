import React from 'react';

interface MapModalProps {
  url: string;
  onClose: () => void;
}

const MapModal: React.FC<MapModalProps> = ({ url, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-11/12 h-5/6 max-w-4xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-slate-800">Visualização da Rota</h2>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 transition-colors text-2xl font-bold leading-none p-1"
            aria-label="Fechar modal"
          >
            &times;
          </button>
        </header>
        <div className="flex-grow">
          <iframe
            src={url}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Rota no Google Maps"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default MapModal;