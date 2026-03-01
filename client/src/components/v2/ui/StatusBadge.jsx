import React from 'react';

const StatusBadge = ({ type, active }) => {
  // Configuración de estilos según el tipo de indicador
  const configs = {
    pwa: { 
      label: 'PWA', 
      color: active ? 'bg-green-500' : 'bg-red-500',
      desc: active ? 'Instalada' : 'Solo Web' 
    },
    reg: { 
      label: 'REG', 
      color: active ? 'bg-blue-500' : 'bg-gray-400',
      desc: active ? 'Registrado' : 'Pendiente'
    }
  };

  const config = configs[type];

  return (
    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg shadow-sm border border-gray-100 min-w-[55px]">
      <div className={`w-2 h-2 rounded-full ${config.color} ${active && 'animate-pulse'}`} />
      <span className="text-[9px] font-black text-zinc-600 tracking-tighter uppercase">
        {config.label}
      </span>
    </div>
  );
};

export default StatusBadge;