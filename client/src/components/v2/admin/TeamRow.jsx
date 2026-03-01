import React from 'react';
import { MessageCircle, Users } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';

const TeamRow = ({ team, onContact }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-2xl mb-3 shadow-sm border border-gray-50 active:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        {/* Logo del equipo */}
        <div className="relative">
          <img src={team.logo_url || 'https://via.placeholder.com/150'} alt="logo" className="w-12 h-12 rounded-full object-cover border-2 border-orange-100 shadow-inner" />
          {team.is_pwa_all && (
             <div className="absolute -top-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white" />
          )}
        </div>
        
        <div>
          <h4 className="text-sm font-black text-zinc-800 uppercase italic leading-none tracking-tight">
            {team.name}
          </h4>
          <div className="flex items-center gap-1 mt-1.5">
            <Users size={10} className="text-gray-400" />
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              {team.registered_count} Jugadores
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <StatusBadge type="reg" active={team.registered_count > 0} />
        <StatusBadge type="pwa" active={team.pwa_active} />
        
        {/* Botón directo a WhatsApp del capitán */}
        <button 
          onClick={() => onContact(team.captain_phone, team.captain_name)}
          className="ml-2 p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 active:scale-95 transition-all"
        >
          <MessageCircle size={20} fill="currentColor" className="opacity-20 absolute" />
          <MessageCircle size={20} className="relative z-10" />
        </button>
      </div>
    </div>
  );
};

export default TeamRow;