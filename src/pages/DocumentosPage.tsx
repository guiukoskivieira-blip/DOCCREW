import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useDocuCrew } from '../context/DocuCrewContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { WorkerDocument, DocumentStatus } from '../types';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  Building2,
  Users,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Download,
  FileCheck2,
  UploadCloud,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { UploadDocumentModal } from '../components/modals/UploadDocumentModal';

export const DocumentosPage: React.FC = () => {
  const { documents, documentTypes, contractors, worksites, downloadDocumentFile } = useDocuCrew();
  const location = useLocation();

  // Check URL query param for pre-filtered worker
  const searchParams = new URLSearchParams(location.search);
  const initialWorkerQuery = searchParams.get('worker') || '';

  const [searchTerm, setSearchTerm] = useState(initialWorkerQuery);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [contractorFilter, setContractorFilter] = useState<string>('ALL');
  const [siteFilter, setSiteFilter] = useState<string>('ALL');
  const [selectedDoc, setSelectedDoc] = useState<WorkerDocument | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const handleDownload = async (doc: WorkerDocument) => {
    if (doc.filePath) {
      setDownloadLoading(true);
      const url = await downloadDocumentFile(doc.filePath);
      setDownloadLoading(false);
      if (url) {
        window.open(url, '_blank');
      } else {
        alert('O arquivo deste documento não foi encontrado no armazenamento.');
      }
    } else {
      alert('Documento de homologação demonstrativo.');
    }
  };

  // Filtered documents list
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.documentTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.contractorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.fileName && doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || doc.status === statusFilter;
      const matchesType = typeFilter === 'ALL' || doc.documentTypeId === typeFilter;
      const matchesContractor = contractorFilter === 'ALL' || doc.contractorId === contractorFilter;
      const matchesSite = siteFilter === 'ALL' || doc.siteId === siteFilter;

      return matchesSearch && matchesStatus && matchesType && matchesContractor && matchesSite;
    });
  }, [documents, searchTerm, statusFilter, typeFilter, contractorFilter, siteFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Repositório & Gestão Master de Documentos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rastreabilidade completa de laudos, ASOs, NRs, fichas de EPI e comprovações de vínculo
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            Enviar Documento
          </button>
          <Link
            to="/analises"
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <FileCheck2 className="w-4 h-4" />
            Fila de Análise
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por titular, tipo, empresa ou arquivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-colors"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-colors"
            >
              <option value="ALL">Todas as Situações</option>
              <option value="APROVADO">Aprovados</option>
              <option value="AGUARDANDO_ANALISE">Aguardando Análise</option>
              <option value="PROXIMO_VENCIMENTO">Próximos do Vencimento</option>
              <option value="VENCIDO">Vencidos</option>
              <option value="RECUSADO">Recusados</option>
              <option value="PENDENTE">Pendentes de Envio</option>
            </select>

            {/* Document Type */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-colors"
            >
              <option value="ALL">Todos os Tipos</option>
              {documentTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>
                  {dt.name}
                </option>
              ))}
            </select>

            {/* Contractor */}
            <select
              value={contractorFilter}
              onChange={(e) => setContractorFilter(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-colors"
            >
              <option value="ALL">Todas as Terceirizadas</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.tradeName}
                </option>
              ))}
            </select>

            {/* Site */}
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

            {(searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL' || contractorFilter !== 'ALL' || siteFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setTypeFilter('ALL');
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

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredDocuments.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhum documento encontrado"
            description="Não encontramos documentos com os filtros atuais."
            actionText="Limpar Filtros"
            onAction={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
              setTypeFilter('ALL');
              setContractorFilter('ALL');
              setSiteFilter('ALL');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Tipo de Documento</th>
                  <th className="py-3.5 px-4">Titular (Trabalhador)</th>
                  <th className="py-3.5 px-4">Terceirizada & Obra</th>
                  <th className="py-3.5 px-4">Emissão</th>
                  <th className="py-3.5 px-4">Vencimento</th>
                  <th className="py-3.5 px-4 text-center">Situação</th>
                  <th className="py-3.5 px-4">Responsável Análise</th>
                  <th className="py-3.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-slate-900">{doc.documentTypeName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {doc.fileName ? doc.fileName : 'Documento não anexado'}
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {doc.workerName}
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <p className="text-slate-800 font-medium">{doc.contractorName}</p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[160px]">{doc.siteName}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {doc.issueDate}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      {doc.expiryDate ? (
                        <span
                          className={
                            doc.status === 'VENCIDO'
                              ? 'text-rose-700 font-bold'
                              : doc.status === 'PROXIMO_VENCIMENTO'
                              ? 'text-amber-700 font-bold'
                              : 'text-slate-700'
                          }
                        >
                          {doc.expiryDate}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Não se aplica</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Badge status={doc.status} variant="document" />
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                      {doc.reviewedBy || <span className="text-slate-400 italic">Pendente</span>}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Document View Modal */}
      {selectedDoc && (
        <Modal
          isOpen={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          title={`Documento: ${selectedDoc.documentTypeName}`}
          subtitle={`Titular: ${selectedDoc.workerName} • ${selectedDoc.contractorName}`}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Badge status={selectedDoc.status} variant="document" />
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800"
              >
                Fechar
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Rejection / Note banner if any */}
            {selectedDoc.rejectionReason && (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800">
                <strong>Motivo do Apontamento / Recusa:</strong>
                <p className="mt-0.5 text-xs text-rose-700">{selectedDoc.rejectionReason}</p>
              </div>
            )}

            {/* Document technical details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Data de Emissão</span>
                <span className="font-bold text-slate-900">{selectedDoc.issueDate}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Data de Vencimento</span>
                <span className="font-bold text-slate-900">
                  {selectedDoc.expiryDate ? selectedDoc.expiryDate : 'Não se aplica'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Obra Alocada</span>
                <span className="font-bold text-slate-900">{selectedDoc.siteName}</span>
              </div>
              {selectedDoc.issuerDetails && (
                <>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Profissional Emitente</span>
                    <span className="font-bold text-slate-900">{selectedDoc.issuerDetails.professionalName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Registro / CRM / CREA</span>
                    <span className="font-bold text-slate-900">{selectedDoc.issuerDetails.registryNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Carga Horária</span>
                    <span className="font-bold text-slate-900">
                      {selectedDoc.issuerDetails.trainingHours ? `${selectedDoc.issuerDetails.trainingHours} horas` : 'N/A'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Simulated Document Preview Box */}
            <div className="p-4 rounded-xl border border-slate-300 bg-slate-900 text-white">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-400" />
                  <div>
                    <h5 className="font-bold text-sm text-white">
                      {selectedDoc.fileName || 'Documento_Homologacao.pdf'}
                    </h5>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {selectedDoc.fileSize || '380 KB'} • Assinatura Digital Verificada
                    </span>
                  </div>
                </div>

                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  Visualização Segura
                </span>
              </div>

              <div className="p-4 bg-slate-950 rounded-lg text-slate-300 font-mono text-[11px] space-y-1.5">
                <p>[CERTIFICADO DE CONFORMIDADE TÉCNICA E SEGURANÇA]</p>
                <p>TITULAR: {selectedDoc.workerName.toUpperCase()}</p>
                <p>EMPRESA: {selectedDoc.contractorName.toUpperCase()}</p>
                <p>DOCUMENTO: {selectedDoc.documentTypeName.toUpperCase()}</p>
                <p>VALIDADE: {selectedDoc.expiryDate ? selectedDoc.expiryDate : 'INDETERMINADA / NÃO SE APLICA'}</p>
                <p className="text-emerald-400 mt-2">✓ Integridade de arquivo e carimbo de tempo válidos.</p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <UploadDocumentModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
        />
      )}
    </div>
  );
};
