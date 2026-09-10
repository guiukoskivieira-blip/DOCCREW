import React from 'react';
import { AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Persistent top banner shown strictly when the application is running in explicit demo mode.
 * Informs the user clearly that displayed data is mock data and won't be persisted.
 */
export const DemoModeBanner: React.FC = () => {
  const { authMode } = useAuth();

  if (authMode !== 'demo') {
    return null;
  }

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-xs border-b border-amber-600/30 z-40 sticky top-0">
      <AlertCircle className="w-4 h-4 shrink-0 text-amber-950" />
      <span>
        MODO DEMONSTRAÇÃO ATIVO — Os dados exibidos são fictícios e não serão salvos no Supabase.
      </span>
    </div>
  );
};
