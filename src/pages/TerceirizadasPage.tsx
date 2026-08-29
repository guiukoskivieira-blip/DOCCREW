import React, { useState, useMemo } from 'react';
import { useDocuCrew } from '../context/DocuCrewContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { Contractor, Worker } from '../types';
import {
  Building2,
  Search,
  Filter,
  Users,
  AlertTriangle,
  Mail,
  Phone,
  Send,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const TerceirizadasPage: React.FC = () => {
  const {
    contractors,
    workers,
    worksites,
    sendContractorNotification,
  } = useDocuCrew();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyChannel, setNotifyChannel] = useState<'EMAIL' | 'WHATSAPP' | 'PORTAL'>('EMAIL');
  const [notifySubject, setNotifySubject] = useState('');

  // Filtered Contractors list
  const filteredContractors = useMemo(() => {
    return contractors.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.tradeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.responsibleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cnpjMasked.includes(searchTerm);

      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [contractors, searchTerm, statusFilter]);

  const handleOpenNotify = (contractor: Contractor) => {
    setSelectedContractor(contractor);
    setNotifySubject(`DocuCrew: Notificação de Pendências Documentais - ${contractor.tradeName}`);
    setShowNotifyModal(true);
  };

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedContractor) {
      sendContractorNotification(selectedContractor.id, notifyChannel, notifySubject);
      setShowNotifyModal(false);
    }
  };

  const getContractorWorkers = (contractorId: string): Worker[] => {
    return workers.filter((w) => w.contractorId === contractorId);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Empresas Prestadoras Terceirizadas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoramento de conformidade jurídica, técnica e de segurança de empresas parceiras
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
          <span className="font-semibold">Total cadastradas:</span>
          <span className="font-bold text-slate-900">{contractors.length} empresas</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por razão social, nome fantasia, responsável ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-colors w-full sm:w-auto"
          >
            <option value="ALL">Todas as Situações</option>
            <option value="CONFORME">Conforme (100%)</option>
            <option value="PARCIAL">Parcial com Pendências</option>
            <option value="BLOQUEADA">Bloqueada</option>
          </select>
        </div>
      </div>

      {/* Contractors Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredContractors.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Nenhuma empresa terceirizada encontrada"
            description="Tente ajustar os termos da busca ou os filtros aplicados."
            actionText="Limpar Filtros"
            onAction={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Empresa / CNPJ</th>
                  <th className="py-3.5 px-4">Responsável & Contato</th>
                  <th className="py-3.5 px-4 text-center">Trabalhadores</th>
                  <th className="py-3.5 px-4 text-center">Docs Pendentes</th>
                  <th className="py-3.5 px-4 text-center">Conformidade</th>
                  <th className="py-3.5 px-4 text-center">Situação</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredContractors.map((c) => {
                  const contractorWorkers = getContractorWorkers(c.id);
                  const activeCount = contractorWorkers.filter((w) => w.status === 'LIBERADO').length;
                  const blockedCount = contractorWorkers.filter((w) => w.status === 'BLOQUEADO').length;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{c.tradeName}</p>
                          <p className="text-slate-500 text-[11px] truncate max-w-xs">{c.name}</p>
                          <span className="inline-block font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5">
                            CNPJ: {c.cnpjMasked}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-900">{c.responsibleName}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {c.responsibleEmail}
                          </p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {c.responsiblePhone}
                          </p>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-bold text-slate-900 text-sm">{c.totalWorkers}</span>
                          <span className="text-[10px] text-slate-500">
                            <span className="text-emerald-600 font-semibold">{activeCount} aptos</span> /{' '}
                            <span className="text-rose-600 font-semibold">{blockedCount} blq</span>
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        {c.pendingDocumentsCount > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 text-xs">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            {c.pendingDocumentsCount} pendentes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-xs">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Zero pendências
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`font-bold font-mono text-sm ${
                              c.complianceRate >= 75
                                ? 'text-emerald-600'
                                : c.complianceRate >= 50
                                ? 'text-amber-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {c.complianceRate}%
                          </span>
                          <div className="w-16 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                c.complianceRate >= 75
                                  ? 'bg-emerald-500'
                                  : c.complianceRate >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${c.complianceRate}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <Badge status={c.status} variant="contractor" />
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedContractor(c)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                          >
                            Ver Ficha
                          </button>
                          <button
                            onClick={() => handleOpenNotify(c)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1"
                            title="Disparar cobrança documental"
                          >
                            <Send className="w-3 h-3" />
                            Cobrar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contractor Details Modal */}
      {selectedContractor && !showNotifyModal && (
        <Modal
          isOpen={!!selectedContractor}
          onClose={() => setSelectedContractor(null)}
          title={`Ficha da Terceirizada: ${selectedContractor.tradeName}`}
          subtitle={`CNPJ: ${selectedContractor.cnpjMasked} • ${selectedContractor.name}`}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <button
                onClick={() => handleOpenNotify(selectedContractor)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Disparar Cobrança de Pendências
              </button>
              <button
                onClick={() => setSelectedContractor(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800"
              >
                Fechar
              </button>
            </div>
          }
        >
          <div className="space-y-5 text-xs">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">Taxa de Conformidade</span>
                <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                  {selectedContractor.complianceRate}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">Trabalhadores</span>
                <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                  {selectedContractor.totalWorkers}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">Situação Cadastral</span>
                <div className="mt-1 flex justify-center">
                  <Badge status={selectedContractor.status} variant="contractor" />
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100">
              <h4 className="font-bold text-slate-900 mb-1.5">Contato do Gestor da Contratada</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-500 block">Responsável:</span>
                  <span className="font-semibold">{selectedContractor.responsibleName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">E-mail:</span>
                  <span className="font-semibold">{selectedContractor.responsibleEmail}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Telefone:</span>
                  <span className="font-semibold">{selectedContractor.responsiblePhone}</span>
                </div>
              </div>
            </div>

            {/* Workers Allocated */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center justify-between">
                <span>Quadro de Trabalhadores Alocados ({getContractorWorkers(selectedContractor.id).length})</span>
                <Link
                  to={`/trabalhadores`}
                  className="text-blue-600 hover:underline text-[11px] font-semibold"
                >
                  Abrir tela de trabalhadores &rarr;
                </Link>
              </h4>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {getContractorWorkers(selectedContractor.id).map((w) => (
                  <div key={w.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                        {w.avatarInitials}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{w.name}</p>
                        <p className="text-[10px] text-slate-500">{w.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {w.blockReason && (
                        <span className="text-[10px] text-rose-600 max-w-xs truncate hidden sm:inline">
                          {w.blockReason}
                        </span>
                      )}
                      <Badge status={w.status} variant="worker" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Send Notification / Charge Modal (Simulated) */}
      {showNotifyModal && selectedContractor && (
        <Modal
          isOpen={showNotifyModal}
          onClose={() => setShowNotifyModal(false)}
          title="Disparar Cobrança Documental"
          subtitle={`Destinatário: ${selectedContractor.tradeName} (${selectedContractor.responsibleName})`}
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setShowNotifyModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendNotification}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                Confirmar Disparo
              </button>
            </div>
          }
        >
          <form onSubmit={handleSendNotification} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Canal de Envio</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setNotifyChannel('EMAIL')}
                  className={`p-2 rounded-lg border text-center font-semibold transition-all ${
                    notifyChannel === 'EMAIL'
                      ? 'bg-blue-50 border-blue-600 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  E-mail Oficial
                </button>
                <button
                  type="button"
                  onClick={() => setNotifyChannel('WHATSAPP')}
                  className={`p-2 rounded-lg border text-center font-semibold transition-all ${
                    notifyChannel === 'WHATSAPP'
                      ? 'bg-blue-50 border-blue-600 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setNotifyChannel('PORTAL')}
                  className={`p-2 rounded-lg border text-center font-semibold transition-all ${
                    notifyChannel === 'PORTAL'
                      ? 'bg-blue-50 border-blue-600 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  Portal Fornecedor
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Assunto / Título do Aviso</label>
              <input
                type="text"
                value={notifySubject}
                onChange={(e) => setNotifySubject(e.target.value)}
                required
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
              <p className="font-semibold">Resumo do disparo simulado:</p>
              <p className="text-[11px] mt-0.5">
                Será gerado um relatório automático listando os documentos vencidos, próximos de vencer e pendentes de envio com link seguro para upload.
              </p>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
