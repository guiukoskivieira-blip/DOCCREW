import React, { useState, useMemo } from 'react';
import { useDocuCrew } from '../context/DocuCrewContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { Worker, WorkerDocument } from '../types';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  FileText,
  Calendar,
  Building2,
  Briefcase,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Plus,
  Printer,
  UploadCloud,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CreateWorkerModal } from '../components/modals/CreateWorkerModal';
import { UploadDocumentModal } from '../components/modals/UploadDocumentModal';
import { PrintReportModal } from '../components/reports/PrintReportModal';

export const TrabalhadoresPage: React.FC = () => {
  const { workers, contractors, worksites, documents, organizationName } = useDocuCrew();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [contractorFilter, setContractorFilter] = useState<string>('ALL');
  const [siteFilter, setSiteFilter] = useState<string>('ALL');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  // Modals
  const [isCreateWorkerOpen, setIsCreateWorkerOpen] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [uploadWorkerId, setUploadWorkerId] = useState<string | undefined>(undefined);
  const [isProntuarioReportOpen, setIsProntuarioReportOpen] = useState(false);

  // Filtered workers list
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      const matchesSearch =
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.cpfMasked.includes(searchTerm) ||
        w.contractorName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;
      const matchesContractor = contractorFilter === 'ALL' || w.contractorId === contractorFilter;
      const matchesSite = siteFilter === 'ALL' || w.siteIds.includes(siteFilter);

      return matchesSearch && matchesStatus && matchesContractor && matchesSite;
    });
  }, [workers, searchTerm, statusFilter, contractorFilter, siteFilter]);

  const getWorkerDocuments = (workerId: string): WorkerDocument[] => {
    return documents.filter((d) => d.workerId === workerId);
  };

  const getSiteNames = (siteIds: string[]) => {
    return siteIds
      .map((id) => worksites.find((s) => s.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Trabalhadores Terceirizados & Prontuário de Segurança
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Controle individual de aptidão laboral, atestados médicos, NRs obrigatórias e bloqueio por pendência
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => setIsCreateWorkerOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            Novo Trabalhador
          </button>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
            {workers.filter((w) => w.status === 'LIBERADO').length} Liberados
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
            {workers.filter((w) => w.status === 'BLOQUEADO').length} Bloqueados
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, função, CPF ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-colors"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-colors"
            >
              <option value="ALL">Todas as Situações</option>
              <option value="LIBERADO">Liberado (Apto)</option>
              <option value="BLOQUEADO">Bloqueado</option>
            </select>

            {/* Contractor */}
            <select
              value={contractorFilter}
              onChange={(e) => setContractorFilter(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-colors"
            >
              <option value="ALL">Todas as Empresas</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.tradeName}
                </option>
              ))}
            </select>

            {/* Worksite */}
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-colors"
            >
              <option value="ALL">Todas as Obras</option>
              {worksites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {(searchTerm || statusFilter !== 'ALL' || contractorFilter !== 'ALL' || siteFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setContractorFilter('ALL');
                  setSiteFilter('ALL');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 hover:underline"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Workers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredWorkers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum trabalhador encontrado"
            description="Não encontramos registros para os filtros selecionados. Tente ajustar os parâmetros."
            actionText="Limpar Filtros"
            onAction={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
              setContractorFilter('ALL');
              setSiteFilter('ALL');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Trabalhador</th>
                  <th className="py-3.5 px-4">Função & Terceirizada</th>
                  <th className="py-3.5 px-4">Obra / Contrato</th>
                  <th className="py-3.5 px-4 text-center">Docs Válidos</th>
                  <th className="py-3.5 px-4 text-center">Situação</th>
                  <th className="py-3.5 px-4">Motivo do Bloqueio</th>
                  <th className="py-3.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredWorkers.map((w) => {
                  const workerDocs = getWorkerDocuments(w.id);

                  return (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-200">
                            {w.avatarInitials}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{w.name}</p>
                            <p className="font-mono text-[10px] text-slate-400">CPF: {w.cpfMasked}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-semibold text-slate-800">{w.role}</p>
                          <p className="text-[11px] text-slate-500">{w.contractorName}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-[200px]">
                        <span className="text-slate-700 font-medium line-clamp-1">
                          {getSiteNames(w.siteIds)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {w.approvedDocumentsCount}/{w.totalRequiredDocuments}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Badge status={w.status} variant="worker" />
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        {w.status === 'BLOQUEADO' ? (
                          <div className="flex items-start gap-1.5 text-rose-700 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200/80">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                            <span className="text-[11px] font-semibold leading-tight">
                              {w.blockReason || 'Pendência documental'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-emerald-700 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>100% regular para acesso</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedWorker(w)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Prontuário
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Worker Details Modal (Prontuário de Segurança) */}
      {selectedWorker && (
        <Modal
          isOpen={!!selectedWorker}
          onClose={() => setSelectedWorker(null)}
          title={`Prontuário Documental: ${selectedWorker.name}`}
          subtitle={`${selectedWorker.role} • ${selectedWorker.contractorName} • CPF: ${selectedWorker.cpfMasked}`}
          maxWidth="3xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Status no Acesso:</span>
                <Badge status={selectedWorker.status} variant="worker" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUploadWorkerId(selectedWorker.id);
                    setIsUploadDocOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1 transition-colors"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Enviar Documento
                </button>
                <button
                  type="button"
                  onClick={() => setIsProntuarioReportOpen(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#061E2E] text-white hover:bg-[#092B42] flex items-center gap-1 shadow-xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir Prontuário (PDF)
                </button>
                <button
                  onClick={() => setSelectedWorker(null)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800"
                >
                  Fechar
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-5 text-xs">
            {/* Status Alert Banner if blocked */}
            {selectedWorker.status === 'BLOQUEADO' && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-rose-900">Trabalhador Bloqueado para Entrada em Obra</h4>
                  <p className="text-xs text-rose-700 mt-0.5">
                    <strong>Motivo:</strong> {selectedWorker.blockReason}
                  </p>
                  <p className="text-[11px] text-rose-600 mt-1">
                    Conforme norma de segurança, o acesso físico ou liberação de catraca permanece suspenso até a regularização deste documento.
                  </p>
                </div>
              </div>
            )}

            {/* Worker Info Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Admissão</span>
                <span className="font-bold text-slate-900">{selectedWorker.admissionDate}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Empresa</span>
                <span className="font-bold text-slate-900">{selectedWorker.contractorName}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Obras Vinculadas</span>
                <span className="font-bold text-slate-900">{getSiteNames(selectedWorker.siteIds)}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Docs Válidos</span>
                <span className="font-bold text-slate-900">
                  {selectedWorker.approvedDocumentsCount} de {selectedWorker.totalRequiredDocuments}
                </span>
              </div>
            </div>

            {/* Detailed Documents Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Lista de Documentos Obrigatórios & Histórico
                </h4>
                <Link
                  to="/analises"
                  className="text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  Abrir Fila de Análise &rarr;
                </Link>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {getWorkerDocuments(selectedWorker.id).map((doc) => (
                  <div key={doc.id} className="p-3 hover:bg-slate-50/80 transition-colors space-y-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{doc.documentTypeName}</p>
                        <p className="text-[11px] text-slate-500">
                          {doc.fileName ? `Arquivo: ${doc.fileName} (${doc.fileSize || 'PDF'})` : 'Nenhum arquivo enviado'}
                        </p>
                      </div>

                      <Badge status={doc.status} variant="document" />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 pt-1">
                      <span>Emissão: <strong>{doc.issueDate}</strong></span>
                      <span>
                        Vencimento:{' '}
                        <strong>
                          {doc.expiryDate ? doc.expiryDate : 'Não se aplica'}
                        </strong>
                      </span>
                      {doc.reviewedBy && (
                        <span>Validado por: <em>{doc.reviewedBy}</em></span>
                      )}
                    </div>

                    {doc.rejectionReason && (
                      <div className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                        <strong>Motivo de Recusa / Pendência:</strong> {doc.rejectionReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Worker Modal */}
      {isCreateWorkerOpen && (
        <CreateWorkerModal
          isOpen={isCreateWorkerOpen}
          onClose={() => setIsCreateWorkerOpen(false)}
        />
      )}

      {/* Upload Document Modal */}
      {isUploadDocOpen && (
        <UploadDocumentModal
          isOpen={isUploadDocOpen}
          onClose={() => {
            setIsUploadDocOpen(false);
            setUploadWorkerId(undefined);
          }}
          defaultWorkerId={uploadWorkerId}
        />
      )}

      {/* Worker Prontuario Print Modal */}
      {isProntuarioReportOpen && selectedWorker && (
        <PrintReportModal
          isOpen={isProntuarioReportOpen}
          onClose={() => setIsProntuarioReportOpen(false)}
          reportType="WORKER_PRONTUARIO"
          organizationName={organizationName}
          worker={selectedWorker}
          documents={documents}
        />
      )}
    </div>
  );
};
