import React from 'react';
import { DocumentStatus, WorkerStatus, ContractorStatus, AlertSeverity } from '../../types';
import { CheckCircle2, AlertTriangle, XCircle, Clock, FileQuestion, ShieldCheck, ShieldAlert } from 'lucide-react';

interface BadgeProps {
  status?: DocumentStatus | WorkerStatus | ContractorStatus | AlertSeverity | string;
  variant?: 'document' | 'worker' | 'contractor' | 'alert' | 'neutral' | 'info';
  children?: React.ReactNode;
  className?: string;
  showIcon?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  variant = 'document',
  children,
  className = '',
  showIcon = true,
}) => {
  // WORKER STATUS
  if (variant === 'worker' || status === 'LIBERADO' || status === 'BLOQUEADO') {
    if (status === 'LIBERADO') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 whitespace-nowrap ${className}`}
        >
          {showIcon && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
          {children || 'Liberado'}
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 whitespace-nowrap ${className}`}
      >
        {showIcon && <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />}
        {children || 'Bloqueado'}
      </span>
    );
  }

  // CONTRACTOR STATUS
  if (variant === 'contractor' || status === 'CONFORME' || status === 'PARCIAL' || status === 'BLOQUEADA') {
    if (status === 'CONFORME') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          {children || 'Conforme (100%)'}
        </span>
      );
    }
    if (status === 'PARCIAL') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          {children || 'Parcial com pendências'}
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        {children || 'Bloqueada'}
      </span>
    );
  }

  // ALERT SEVERITY
  if (variant === 'alert' || status === 'CRITICA' || status === 'ATENCAO' || status === 'INFORMATIVA') {
    if (status === 'CRITICA') {
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 whitespace-nowrap ${className}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          {children || 'Crítico'}
        </span>
      );
    }
    if (status === 'ATENCAO') {
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 whitespace-nowrap ${className}`}>
          <Clock className="w-3.5 h-3.5 text-amber-700" />
          {children || 'Atenção'}
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200 whitespace-nowrap ${className}`}>
        {children || 'Informativo'}
      </span>
    );
  }

  // DOCUMENT STATUS
  switch (status) {
    case 'APROVADO':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap ${className}`}
        >
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
          {children || 'Aprovado'}
        </span>
      );

    case 'AGUARDANDO_ANALISE':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap ${className}`}
        >
          {showIcon && <Clock className="w-3.5 h-3.5 text-blue-600" />}
          {children || 'Aguardando Análise'}
        </span>
      );

    case 'PROXIMO_VENCIMENTO':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap ${className}`}
        >
          {showIcon && <Clock className="w-3.5 h-3.5 text-amber-600" />}
          {children || 'Próximo do Vencimento'}
        </span>
      );

    case 'VENCIDO':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap ${className}`}
        >
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
          {children || 'Vencido'}
        </span>
      );

    case 'RECUSADO':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-800 border border-rose-300 whitespace-nowrap ${className}`}
        >
          {showIcon && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
          {children || 'Recusado'}
        </span>
      );

    case 'PENDENTE':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap ${className}`}
        >
          {showIcon && <FileQuestion className="w-3.5 h-3.5 text-slate-500" />}
          {children || 'Pendente de Envio'}
        </span>
      );
  }
};
