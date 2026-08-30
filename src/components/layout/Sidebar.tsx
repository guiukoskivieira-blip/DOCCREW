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
  const aptCount = workers.filter((w) => w.status === 'LIBERADO').length;
  const compliancePct = workers.length > 0 ? Math.round((aptCount / workers.length) * 100) : 0;

  const navItems = [
    {
      to: '/',
      label: 'Visão Executiva',
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
          className="fixed inset-0 bg-[#061E2E]/80 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#061E2E] text-slate-200 border-r border-[#0B2A3F] transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#0B2A3F] bg-[#061E2E]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="shrink-0 flex items-center justify-center">
              <DocuCrewIcon variant="dark" className="w-8 h-8" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-lg tracking-tight text-white flex items-center">
                  DocuCrew
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#FFC400] truncate">
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
                      ? 'bg-[#FFC400] text-[#061E2E] font-bold shadow-md shadow-[#FFC400]/20'
                      : 'text-[#93A5B8] hover:bg-[#0B2A3F] hover:text-white'
                  }`
                }
                title={isCollapsed ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${
                        isActive ? 'text-[#061E2E]' : 'text-[#93A5B8] group-hover:text-white'
                      }`}
                    />

                    {!isCollapsed && <span className="truncate flex-1">{item.label}</span>}

                    {/* Badge if present */}
                    {item.badge && !isCollapsed && (
                      <span
                        className={`ml-auto px-2 py-0.5 text-[11px] font-bold rounded-full shrink-0 ${
                          isActive
                            ? 'bg-[#061E2E] text-white'
                            : item.badgeVariant === 'danger'
                            ? 'bg-[#E9304F]/20 text-[#FF8596] border border-[#E9304F]/30'
                            : item.badgeVariant === 'warning'
                            ? 'bg-[#FFC400]/20 text-[#FFC400] border border-[#FFC400]/30'
                            : 'bg-[#1473E6]/20 text-[#60A5FA] border border-[#1473E6]/30'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Dot if collapsed with badge */}
                    {item.badge && isCollapsed && (
                      <span
                        className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                          isActive
                            ? 'bg-[#061E2E]'
                            : item.badgeVariant === 'danger'
                            ? 'bg-[#E9304F]'
                            : item.badgeVariant === 'warning'
                            ? 'bg-[#FFC400]'
                            : 'bg-[#1473E6]'
                        }`}
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Compliance Quick Status */}
        {!isCollapsed && (
          <div className="p-3.5 mx-3 mb-3 rounded-xl bg-[#0B2A3F] border border-[#153E5B]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#00A878]" />
                Aptidão Geral
              </span>
              <span className="font-bold text-[#FFC400]">{compliancePct}%</span>
            </div>
            <div className="w-full bg-[#061E2E] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#00A878] h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${compliancePct}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-300 mt-1.5 leading-tight">
              {aptCount} de {workers.length} trabalhadores aptos com 100% dos docs em dia.
            </p>
          </div>
        )}

        {/* Collapse Toggle for Desktop */}
        <div className="hidden lg:flex items-center justify-between p-3 border-t border-[#0B2A3F] bg-[#061E2E]">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00A878] animate-pulse" />
              <span className="text-xs text-slate-300 font-mono">Modo Operacional</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#0B2A3F] transition-colors ml-auto"
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

