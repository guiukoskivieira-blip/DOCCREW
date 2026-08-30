import React, { useState, useRef, useEffect } from 'react';
import {
  User as UserIcon,
  LogOut,
  KeyRound,
  Shield,
  Database,
  ChevronDown,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UserMenu: React.FC = () => {
  const {
    currentUser,
    user,
    authMode,
    isConfigured,
    supabaseUrl,
    signOut,
    openAuthModal,
  } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'FISCAL_SEGURANCA':
        return 'Fiscal de Segurança (TST)';
      case 'ANALISTA_DOCUMENTAL':
        return 'Analista Documental';
      case 'ADMINISTRADOR':
        return 'Administrador Geral';
      case 'AUDITOR':
        return 'Auditor de Conformidade';
      default:
        return role;
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left"
        aria-label="Menu do Usuário"
      >
        <div className="w-8 h-8 rounded-full bg-[#14181F] text-amber-400 font-black text-xs flex items-center justify-center border border-slate-700 shadow-xs">
          {getInitials(currentUser.name)}
        </div>

        <div className="hidden lg:flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[140px]">
              {currentUser.name}
            </span>
            {authMode === 'supabase' ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Autenticado via Supabase"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500" title="Perfil em Modo Demonstração"></span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
            {getRoleLabel(currentUser.role)}
          </span>
        </div>

        <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95">
          {/* User Info Header */}
          <div className="p-4 bg-slate-900 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center">
                {getInitials(currentUser.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                <p className="text-[11px] text-slate-300 truncate">{currentUser.email}</p>
                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-medium">
                  {getRoleLabel(currentUser.role)}
                </span>
              </div>
            </div>
          </div>

          {/* Supabase Status Banner */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-medium">Status do Auth:</span>
            </div>
            {isConfigured && authMode === 'supabase' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Supabase Ativo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Modo Demo
              </span>
            )}
          </div>

          {/* Action Links */}
          <div className="p-2 space-y-1 text-xs">
            <button
              onClick={() => {
                setIsOpen(false);
                openAuthModal();
              }}
              className="w-full px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 flex items-center gap-2 font-medium transition-colors"
            >
              <KeyRound className="w-4 h-4 text-blue-600" />
              <span>Gerenciar Autenticação / Trocar Conta</span>
            </button>

            {authMode === 'supabase' && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  signOut();
                }}
                className="w-full px-3 py-2 rounded-xl text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-medium transition-colors"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Desconectar do Supabase</span>
              </button>
            )}
          </div>

          {/* Footer Info */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>DocuCrew v1.2</span>
            <span>Auth PKCE Ready</span>
          </div>
        </div>
      )}
    </div>
  );
};
