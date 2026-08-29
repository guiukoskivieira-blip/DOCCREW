import React from 'react';
import { useDocuCrew } from '../../context/DocuCrewContext';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useDocuCrew();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => {
        let borderClass = 'border-slate-200';
        let bgClass = 'bg-white';
        let Icon = Info;
        let iconColor = 'text-blue-600';

        if (toast.type === 'success') {
          borderClass = 'border-emerald-200';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-600';
        } else if (toast.type === 'error') {
          borderClass = 'border-rose-200';
          Icon = XCircle;
          iconColor = 'text-rose-600';
        } else if (toast.type === 'warning') {
          borderClass = 'border-amber-200';
          Icon = AlertTriangle;
          iconColor = 'text-amber-600';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-lg ${bgClass} ${borderClass} flex items-start gap-3 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3`}
          >
            <div className="mt-0.5 shrink-0">
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div className="flex-1 pr-2">
              <h4 className="text-sm font-bold text-slate-900">{toast.title}</h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
              aria-label="Fechar notificação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
