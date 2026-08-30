import React, { useState } from 'react';
import { Menu, Bell, ShieldCheck, UserCheck, AlertTriangle, ChevronDown, Check, ExternalLink } from 'lucide-react';
import { useDocuCrew } from '../../context/DocuCrewContext';
import { Link } from 'react-router-dom';
import { DocuCrewIcon } from '../common/DocuCrewLogo';
import { UserMenu } from '../auth/UserMenu';

interface HeaderProps {
  onMenuClick: () => void;
  pageTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, pageTitle }) => {
  const { alerts, markAlertAsRead } = useDocuCrew();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadAlerts = alerts.filter((a) => !a.isRead);
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICA').length;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden flex items-center gap-2"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
          <DocuCrewIcon variant="light" className="w-6 h-6 lg:hidden" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            {pageTitle || 'Painel de Controle'}
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            DocuCrew • Controle de documentos e conformidade de terceirizados
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Quick status pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold">Ambiente demonstrativo</span>
        </div>

        {/* Notifications Popover Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Notificações e alertas"
          >
            <Bell className="w-5 h-5" />
            {unreadAlerts.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
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
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold">Alertas Operacionais</h3>
                    <p className="text-[11px] text-slate-300">
                      {criticalCount} alertas críticos requerem atenção
                    </p>
                  </div>
                  <Link
                    to="/alertas"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-sky-300 hover:text-sky-200 font-medium underline flex items-center gap-1"
                  >
                    Ver todos
                  </Link>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {alerts.slice(0, 4).map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => markAlertAsRead(alert.id)}
                      className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                        !alert.isRead ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 shrink-0">
                          {alert.severity === 'CRITICA' ? (
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                          ) : (
                            <ShieldCheck className="w-4 h-4 text-amber-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {alert.title}
                          </p>
                          <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                            {alert.description}
                          </p>
                          <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                            <span>{alert.contractorName}</span>
                            <span>{alert.createdAt}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                  <Link
                    to="/alertas"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Abrir Central Completa de Alertas &rarr;
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile & Auth Menu */}
        <div className="pl-2 sm:pl-3 border-l border-slate-200">
          <UserMenu />
        </div>
      </div>
    </header>
  );
};
