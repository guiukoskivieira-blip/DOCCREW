import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Briefcase,
  FileText,
  FileCheck2,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useDocuCrew } from '../../context/DocuCrewContext';
import { DocuCrewIcon } from '../common/DocuCrewLogo';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { documents, alerts, workers } = useDocuCrew();

  const pendingAnalysisCount = documents.filter((d) => d.status === 'AGUARDANDO_ANALISE').length;
  const criticalAlertsCount = alerts.filter((a) => a.severity === 'CRITICA' && !a.isRead).length;
  const blockedWorkersCount = workers.filter((w) => w.status === 'BLOQUEADO').length;

  const navItems = [
    {
      to: '/',
      label: 'Página Geral',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/terceirizadas',
      label: 'Terceirizadas',
      icon: Building2,
      badge: null,
    },
    {
      to: '/trabalhadores',
      label: 'Trabalhadores',
      icon: Users,
      badge: blockedWorkersCount > 0 ? `${blockedWorkersCount} blq` : null,
      badgeVariant: 'danger',
    },
    {
      to: '/obras',
      label: 'Obras e Contratos',
      icon: Briefcase,
      badge: null,
    },
    {
      to: '/documentos',
      label: 'Documentos',
      icon: FileText,
      badge: null,
    },
    {
      to: '/analises',
      label: 'Análises',
      icon: FileCheck2,
      badge: pendingAnalysisCount > 0 ? `${pendingAnalysisCount}` : null,
      badgeVariant: 'info',
    },
    {
      to: '/alertas',
      label: 'Alertas',
      icon: Bell,
      badge: criticalAlertsCount > 0 ? `${criticalAlertsCount}` : null,
      badgeVariant: 'warning',
    },
    {
      to: '/configuracoes',
      label: 'Configurações',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0b1e33] text-slate-200 border-r border-slate-800/80 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="shrink-0 flex items-center justify-center">
              <DocuCrewIcon variant="dark" className="w-8 h-8" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-black text-lg tracking-tight text-white flex items-center">
                  DocuCrew
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 truncate">
                  Gestão & Conformidade
                </span>
              </div>
            )}
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`
                }
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105`} />
                
                {!isCollapsed && <span className="truncate flex-1">{item.label}</span>}

                {/* Badge if present */}
                {item.badge && !isCollapsed && (
                  <span
                    className={`ml-auto px-2 py-0.5 text-[11px] font-bold rounded-full shrink-0 ${
                      item.badgeVariant === 'danger'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : item.badgeVariant === 'warning'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Dot if collapsed with badge */}
                {item.badge && isCollapsed && (
                  <span
                    className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                      item.badgeVariant === 'danger'
                        ? 'bg-rose-500'
                        : item.badgeVariant === 'warning'
                        ? 'bg-amber-400'
                        : 'bg-sky-400'
                    }`}
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Compliance Quick Status */}
        {!isCollapsed && (
          <div className="p-3 mx-3 mb-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Aptidão Geral
              </span>
              <span className="font-bold text-white">55%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '55%' }} />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-tight">
              11 de 20 trabalhadores aptos com 100% dos docs em dia.
            </p>
          </div>
        )}

        {/* Collapse Toggle for Desktop */}
        <div className="hidden lg:flex items-center justify-between p-3 border-t border-slate-800/80">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-400 font-mono">Modo Homologação</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-auto"
            title={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            aria-label="Alternar menu"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>
    </>
  );
};
