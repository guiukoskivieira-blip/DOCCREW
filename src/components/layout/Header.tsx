import React, { useState } from 'react';
import { Menu, Bell, ShieldCheck, UserCheck, AlertTriangle, ChevronDown, Check, ExternalLink, Shield } from 'lucide-react';
import { useDocuCrew } from '../../context/DocuCrewContext';
import { Link } from 'react-router-dom';
import { DocuCrewIcon } from '../common/DocuCrewLogo';
import { UserMenu } from '../auth/UserMenu';

interface HeaderProps {
  onMenuClick: () => void;
  pageTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, pageTitle }) => {
  const { alerts, markAlertAsRead, organizationName, isUsingSupabaseData, dataLoadingState } = useDocuCrew();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadAlerts = alerts.filter((a) => !a.isRead);
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICA').length;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-[#DCE4EC] px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg text-[#102033] hover:bg-[#F5F7FA] lg:hidden flex items-center gap-2"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
          <DocuCrewIcon variant="light" className="w-6 h-6 lg:hidden" />
        </button>

        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base sm:text-lg font-extrabold text-[#102033] tracking-tight">
              {pageTitle || 'Visão Executiva'}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-[#F5F7FA] text-[#061E2E] border border-[#DCE4EC]">
              <span className="w-2 h-2 rounded-full bg-[#00A878]"></span>
              {organizationName}
            </span>
          </div>
          <p className="text-xs text-[#587087] hidden sm:block">
            DocuCrew • Gestão de Conformidade de Terceirizados & Prontuários
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Quick status pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-[#F5F7FA] border border-[#DCE4EC] text-xs text-[#102033]">
          <span
            className={`w-2 h-2 rounded-full ${
              dataLoadingState === 'LOADING'
                ? 'bg-[#FFC400] animate-spin'
                : isUsingSupabaseData
                ? 'bg-[#00A878] animate-pulse'
                : 'bg-[#1473E6]'
            }`}
          />
          <span className="font-bold text-[11px]">
            {dataLoadingState === 'LOADING'
              ? 'Sincronizando...'
              : isUsingSupabaseData
              ? organizationName
              : 'Ambiente Demonstrativo'}
          </span>
        </div>

        {/* Notifications Popover Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-[#587087] hover:text-[#102033] hover:bg-[#F5F7FA] transition-colors"
            aria-label="Notificações e alertas"
          >
            <Bell className="w-5 h-5" />
            {unreadAlerts.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#E9304F] text-white text-[10px] font-extrabold flex items-center justify-center animate-pulse">
                {unreadAlerts.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#DCE4EC] z-50 overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-4 bg-[#061E2E] text-white flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold">Alertas Operacionais</h3>
                    <p className="text-[11px] text-slate-300">
                      {criticalCount} alertas críticos requerem atenção
                    </p>
                  </div>
                  <Link
                    to="/alertas"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-[#FFC400] hover:underline font-bold flex items-center gap-1"
                  >
                    Ver todos
                  </Link>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-[#DCE4EC]/60">
                  {alerts.slice(0, 4).map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => markAlertAsRead(alert.id)}
                      className={`p-3.5 hover:bg-[#F5F7FA] cursor-pointer transition-colors ${
                        !alert.isRead ? 'bg-[#FFC400]/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 shrink-0">
                          {alert.severity === 'CRITICA' ? (
                            <AlertTriangle className="w-4 h-4 text-[#E9304F]" />
                          ) : (
                            <ShieldCheck className="w-4 h-4 text-[#FFC400]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#102033] truncate">
                            {alert.title}
                          </p>
                          <p className="text-[11px] text-[#587087] line-clamp-2 mt-0.5">
                            {alert.description}
                          </p>
                          <div className="flex items-center justify-between mt-1.5 text-[10px] text-[#587087]">
                            <span>{alert.contractorName}</span>
                            <span>{alert.createdAt}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-[#F5F7FA] border-t border-[#DCE4EC] text-center">
                  <Link
                    to="/alertas"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs font-bold text-[#061E2E] hover:text-[#FFC400]"
                  >
                    Abrir Central Completa de Alertas &rarr;
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile & Auth Menu */}
        <div className="pl-2 sm:pl-3 border-l border-[#DCE4EC]">
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

