import React, { useRef } from 'react';
import { Modal } from '../common/Modal';
import { Printer, Download, ShieldCheck, ShieldAlert, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { Worker, Contractor, WorkSite, WorkerDocument, AlertNotification } from '../../types';

export type ReportType =
  | 'DASHBOARD_EXECUTIVE'
  | 'WORKER_PRONTUARIO'
  | 'CONTRACTOR_COMPLIANCE'
  | 'SITE_OPERATIONAL'
  | 'ALERTS_PENDENCIES';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: ReportType;
  organizationName: string;
  worker?: Worker | null;
  contractor?: Contractor | null;
  site?: WorkSite | null;
  workers?: Worker[];
  contractors?: Contractor[];
  worksites?: WorkSite[];
  documents?: WorkerDocument[];
  alerts?: AlertNotification[];
  indicators?: any;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  reportType,
  organizationName,
  worker,
  contractor,
  site,
  workers = [],
  contractors = [],
  worksites = [],
  documents = [],
  alerts = [],
  indicators,
}) => {
  const printContainerRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const getReportTitle = () => {
    switch (reportType) {
      case 'DASHBOARD_EXECUTIVE':
        return 'Relatório Executivo de Conformidade Geral';
      case 'WORKER_PRONTUARIO':
        return `Prontuário de Conformidade Ocupacional — ${worker?.name || 'Trabalhador'}`;
      case 'CONTRACTOR_COMPLIANCE':
        return `Relatório de Conformidade — ${contractor?.tradeName || 'Terceirizada'}`;
      case 'SITE_OPERATIONAL':
        return `Relatório Operacional da Obra — ${site?.name || 'Obra'}`;
      case 'ALERTS_PENDENCIES':
        return 'Relatório de Pendências, Vencimentos e Alertas Críticos';
      default:
        return 'Relatório Corporativo DocuCrew';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getReportTitle()}
      subtitle="Visualização oficial formatada para emissão, auditoria e impressão em PDF"
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-slate-500">
            Documento rastreável gerado pelo DocuCrew Compliance Engine
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#061E2E] hover:bg-[#092B42] text-white transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir ou Salvar em PDF
            </button>
          </div>
        </div>
      }
    >
      <div ref={printContainerRef} className="space-y-6 text-xs text-slate-800 print:text-black">
        {/* Printable Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#061E2E] text-amber-400 font-black text-sm flex items-center justify-center">
                D
              </div>
              <h2 className="text-base font-black tracking-tight text-slate-950">
                DOCU<span className="text-amber-500">CREW</span>
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
              Sistema Integrado de Gestão e Conformidade de Terceirizados
            </p>
          </div>

          <div className="text-right text-[11px] space-y-0.5">
            <p className="font-bold text-slate-900">{organizationName}</p>
            <p className="text-slate-500 font-mono">Emissão: {currentDate} às {currentTime}</p>
            <p className="text-emerald-700 font-semibold">Autenticação: DOCU-{Date.now().toString(36).toUpperCase()}</p>
          </div>
        </div>

        {/* 1. Dashboard Executive Report */}
        {reportType === 'DASHBOARD_EXECUTIVE' && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Total de Trabalhadores</span>
                <span className="text-lg font-black text-slate-900">{workers.length}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">Liberados (Aptos)</span>
                <span className="text-lg font-black text-emerald-600">
                  {workers.filter((w) => w.status === 'LIBERADO').length}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-700 block">Bloqueados</span>
                <span className="text-lg font-black text-rose-600">
                  {workers.filter((w) => w.status === 'BLOQUEADO').length}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-700 block">Conformidade Geral</span>
                <span className="text-lg font-black text-blue-700">
                  {indicators?.complianceRate ?? 0}%
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 text-xs mb-2">Desempenho por Terceirizada</h4>
              <table className="w-full text-left border-collapse border border-slate-200 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2">Empresa</th>
                    <th className="p-2">CNPJ</th>
                    <th className="p-2 text-center">Trabalhadores</th>
                    <th className="p-2 text-center">Aptos</th>
                    <th className="p-2 text-center">Bloqueados</th>
                    <th className="p-2 text-right">Índice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contractors.map((c) => {
                    const cWorkers = workers.filter((w) => w.contractorId === c.id);
                    const cApt = cWorkers.filter((w) => w.status === 'LIBERADO').length;
                    const cBlq = cWorkers.filter((w) => w.status === 'BLOQUEADO').length;
                    return (
                      <tr key={c.id}>
                        <td className="p-2 font-bold text-slate-900">{c.tradeName}</td>
                        <td className="p-2 font-mono text-slate-600">{c.cnpjMasked}</td>
                        <td className="p-2 text-center">{cWorkers.length}</td>
                        <td className="p-2 text-center text-emerald-700 font-bold">{cApt}</td>
                        <td className="p-2 text-center text-rose-700 font-bold">{cBlq}</td>
                        <td className="p-2 text-right font-mono font-bold text-blue-700">
                          {c.complianceRate}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. Worker Prontuário Report */}
        {reportType === 'WORKER_PRONTUARIO' && worker && (
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Nome do Trabalhador</span>
                <span className="font-bold text-slate-900">{worker.name}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">CPF (Mascarado LGPD)</span>
                <span className="font-mono font-bold text-slate-900">{worker.cpfMasked}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Função / Cargo</span>
                <span className="font-bold text-slate-900">{worker.role}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Empresa Terceirizada</span>
                <span className="font-bold text-slate-900">{worker.contractorName}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Data de Admissão</span>
                <span className="font-mono text-slate-900">{worker.admissionDate}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Situação Atual</span>
                <span
                  className={`font-black uppercase px-2 py-0.5 rounded text-[10px] inline-block ${
                    worker.status === 'LIBERADO'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {worker.status}
                </span>
              </div>
            </div>

            {worker.status === 'BLOQUEADO' && worker.blockReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                <strong className="block text-[11px]">Justificativa do Bloqueio de Acesso:</strong>
                <p className="text-[11px] mt-0.5">{worker.blockReason}</p>
              </div>
            )}

            <div>
              <h4 className="font-bold text-slate-900 text-xs mb-2">Quadro Demonstrativo de Documentos</h4>
              <table className="w-full text-left border-collapse border border-slate-200 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2">Tipo de Documento</th>
                    <th className="p-2">Emissão</th>
                    <th className="p-2">Vencimento</th>
                    <th className="p-2">Situação</th>
                    <th className="p-2">Responsável Análise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents
                    .filter((d) => d.workerId === worker.id)
                    .map((doc) => (
                      <tr key={doc.id}>
                        <td className="p-2 font-bold text-slate-900">{doc.documentTypeName}</td>
                        <td className="p-2 font-mono text-slate-600">{doc.issueDate}</td>
                        <td className="p-2 font-mono">{doc.expiryDate || 'N/A'}</td>
                        <td className="p-2">
                          <span
                            className={`font-bold ${
                              doc.status === 'APROVADO'
                                ? 'text-emerald-700'
                                : doc.status === 'VENCIDO'
                                ? 'text-rose-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {doc.status}
                          </span>
                        </td>
                        <td className="p-2 text-slate-500">{doc.reviewedBy || 'Pendente'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Contractor Compliance Report */}
        {reportType === 'CONTRACTOR_COMPLIANCE' && contractor && (
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Razão Social</span>
                <span className="font-bold text-slate-900">{contractor.name}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Nome Fantasia</span>
                <span className="font-bold text-slate-900">{contractor.tradeName}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">CNPJ</span>
                <span className="font-mono font-bold text-slate-900">{contractor.cnpjMasked}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Responsável Operacional</span>
                <span className="text-slate-900">{contractor.responsibleName}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Contato</span>
                <span className="text-slate-900">{contractor.responsiblePhone}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Taxa de Conformidade</span>
                <span className="font-black text-blue-700 text-sm">{contractor.complianceRate}%</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 text-xs mb-2">Efetivo de Trabalhadores Alocados</h4>
              <table className="w-full text-left border-collapse border border-slate-200 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2">Nome</th>
                    <th className="p-2">Função</th>
                    <th className="p-2">CPF</th>
                    <th className="p-2 text-center">Status</th>
                    <th className="p-2">Pendências</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workers
                    .filter((w) => w.contractorId === contractor.id)
                    .map((w) => (
                      <tr key={w.id}>
                        <td className="p-2 font-bold text-slate-900">{w.name}</td>
                        <td className="p-2 text-slate-700">{w.role}</td>
                        <td className="p-2 font-mono text-slate-600">{w.cpfMasked}</td>
                        <td className="p-2 text-center">
                          <span
                            className={`font-bold ${
                              w.status === 'LIBERADO' ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {w.status}
                          </span>
                        </td>
                        <td className="p-2 text-slate-600 text-[10px]">{w.blockReason || 'Regular'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Site Operational Report */}
        {reportType === 'SITE_OPERATIONAL' && site && (
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Código / Sigla</span>
                <span className="font-mono font-bold text-slate-900">{site.code}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Nome da Obra</span>
                <span className="font-bold text-slate-900">{site.name}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Cliente Contratante</span>
                <span className="font-bold text-slate-900">{site.clientName}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Localização</span>
                <span className="text-slate-900">{site.location}</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 text-xs mb-2">Trabalhadores Alocados nesta Obra</h4>
              <table className="w-full text-left border-collapse border border-slate-200 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2">Nome</th>
                    <th className="p-2">Função</th>
                    <th className="p-2">Empresa Terceirizada</th>
                    <th className="p-2 text-center">Status de Acesso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workers
                    .filter((w) => w.siteIds.includes(site.id))
                    .map((w) => (
                      <tr key={w.id}>
                        <td className="p-2 font-bold text-slate-900">{w.name}</td>
                        <td className="p-2 text-slate-700">{w.role}</td>
                        <td className="p-2 text-slate-800 font-medium">{w.contractorName}</td>
                        <td className="p-2 text-center font-bold">
                          <span className={w.status === 'LIBERADO' ? 'text-emerald-700' : 'text-rose-700'}>
                            {w.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. Alerts & Critical Pendencies Report */}
        {reportType === 'ALERTS_PENDENCIES' && (
          <div className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs">
              <strong>Atenção e Prioridade Operacional:</strong>
              <p className="mt-0.5">
                Relação consolidada de não-conformidades críticas, documentos vencidos e avisos preventivos para regularização imediata.
              </p>
            </div>

            <table className="w-full text-left border-collapse border border-slate-200 text-[11px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-2">Tipo</th>
                  <th className="p-2">Trabalhador / Titular</th>
                  <th className="p-2">Terceirizada</th>
                  <th className="p-2">Documento</th>
                  <th className="p-2">Detalhes / Vencimento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alerts.map((a) => (
                  <tr key={a.id}>
                    <td className="p-2 font-bold">
                      <span
                        className={
                          a.type === 'VENCIDO'
                            ? 'text-rose-700'
                            : a.type === 'PROXIMO_VENCIMENTO'
                            ? 'text-amber-700'
                            : 'text-blue-700'
                        }
                      >
                        {a.type === 'VENCIDO' ? 'Vencido' : a.type === 'PROXIMO_VENCIMENTO' ? 'A Vencer' : 'Faltante'}
                      </span>
                    </td>
                    <td className="p-2 font-bold text-slate-900">{a.workerName || '—'}</td>
                    <td className="p-2 text-slate-800">{a.contractorName}</td>
                    <td className="p-2 text-slate-700">{a.documentName}</td>
                    <td className="p-2 font-mono text-slate-600">{a.expiryDate || a.details || 'Pendente'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Signature */}
        <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-600">
          <div>
            <div className="border-t border-slate-400 w-48 mx-auto mb-1 pt-1 font-bold text-slate-900">
              Responsável Técnico SST / TST
            </div>
            <p>Fiscalização e Auditoria de Segurança</p>
          </div>
          <div>
            <div className="border-t border-slate-400 w-48 mx-auto mb-1 pt-1 font-bold text-slate-900">
              Gestor de Contratos / DocuCrew
            </div>
            <p>{organizationName}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
