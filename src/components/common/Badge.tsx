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
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#00A878]/10 text-[#00A878] border border-[#00A878]/30 whitespace-nowrap ${className}`}
        >
          {showIcon && <ShieldCheck className="w-3.5 h-3.5 text-[#00A878]" />}
          {children || 'Liberado'}
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E9304F]/10 text-[#E9304F] border border-[#E9304F]/30 whitespace-nowrap ${className}`}
      >
        {showIcon && <ShieldAlert className="w-3.5 h-3.5 text-[#E9304F]" />}
        {children || 'Bloqueado'}
      </span>
    );
  }

  // CONTRACTOR STATUS
  if (variant === 'contractor' || status === 'CONFORME' || status === 'PARCIAL' || status === 'BLOQUEADA') {
    if (status === 'CONFORME') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#00A878]/10 text-[#00A878] border border-[#00A878]/30 whitespace-nowrap ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#00A878]"></span>
          {children || 'Conforme (100%)'}
        </span>
      );
    }
    if (status === 'PARCIAL') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFC400]/15 text-[#B45309] border border-[#FFC400]/40 whitespace-nowrap ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFC400]"></span>
          {children || 'Parcial com pendências'}
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E9304F]/10 text-[#E9304F] border border-[#E9304F]/30 whitespace-nowrap ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#E9304F]"></span>
        {children || 'Bloqueada'}
      </span>
    );
  }

  // ALERT SEVERITY
  if (variant === 'alert' || status === 'CRITICA' || status === 'ATENCAO' || status === 'INFORMATIVA') {
    if (status === 'CRITICA') {
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-[#E9304F]/10 text-[#E9304F] border border-[#E9304F]/30 whitespace-nowrap ${className}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-[#E9304F]" />
          {children || 'Crítico'}
        </span>
      );
    }
    if (status === 'ATENCAO') {
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-[#FFC400]/15 text-[#B45309] border border-[#FFC400]/40 whitespace-nowrap ${className}`}>
          <Clock className="w-3.5 h-3.5 text-[#D97706]" />
          {children || 'Atenção'}
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#1473E6]/10 text-[#1473E6] border border-[#1473E6]/30 whitespace-nowrap ${className}`}>
        {children || 'Informativo'}
      </span>
    );
  }

  // DOCUMENT STATUS
  switch (status) {
    case 'APROVADO':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#00A878]/10 text-[#00A878] border border-[#00A878]/30 whitespace-nowrap ${className}`}
        >
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-[#00A878]" />}
          {children || 'Aprovado'}
        </span>
      );

    case 'AGUARDANDO_ANALISE':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1473E6]/10 text-[#1473E6] border border-[#1473E6]/30 whitespace-nowrap ${className}`}
        >
          {showIcon && <Clock className="w-3.5 h-3.5 text-[#1473E6]" />}
          {children || 'Aguardando Análise'}
        </span>
      );

    case 'PROXIMO_VENCIMENTO':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFC400]/15 text-[#B45309] border border-[#FFC400]/40 whitespace-nowrap ${className}`}
        >
          {showIcon && <Clock className="w-3.5 h-3.5 text-[#D97706]" />}
          {children || 'Próximo do Vencimento'}
        </span>
      );

    case 'VENCIDO':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E9304F]/10 text-[#E9304F] border border-[#E9304F]/30 whitespace-nowrap ${className}`}
        >
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-[#E9304F]" />}
          {children || 'Vencido'}
        </span>
      );

    case 'RECUSADO':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E9304F]/10 text-[#E9304F] border border-[#E9304F]/30 whitespace-nowrap ${className}`}
        >
          {showIcon && <XCircle className="w-3.5 h-3.5 text-[#E9304F]" />}
          {children || 'Recusado'}
        </span>
      );

    case 'PENDENTE':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F5F7FA] text-[#587087] border border-[#DCE4EC] whitespace-nowrap ${className}`}
        >
          {showIcon && <FileQuestion className="w-3.5 h-3.5 text-[#587087]" />}
          {children || 'Pendente de Envio'}
        </span>
      );
  }
};

