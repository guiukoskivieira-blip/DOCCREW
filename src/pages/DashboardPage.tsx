import React, { useState, useMemo } from 'react';
import { useDocuCrew } from '../context/DocuCrewContext';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { calculateIndicators } from '../domain/supabaseAdapters';
import { Link } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  FileCheck2,
  Filter,
  Building2,
  Briefcase,
  AlertCircle,
  RefreshCw,
  Info,
  CheckCircle2,
  Printer,
  FileDown,
} from 'lucide-react';
import { QuickActionsMenu } from '../components/modals/QuickActionsMenu';
import { UploadDocumentModal } from '../components/modals/UploadDocumentModal';
import { CreateWorkerModal } from '../components/modals/CreateWorkerModal';
import { CreateContractorModal } from '../components/modals/CreateContractorModal';
import { CreateSiteModal } from '../components/modals/CreateSiteModal';
import { CreateDocumentTypeModal } from '../components/modals/CreateDocumentTypeModal';
import { PrintReportModal } from '../components/reports/PrintReportModal';

export const DashboardPage: React.FC = () => {
  const {
    contractors,
    worksites,
    workers,
    documents,
    alerts,
    organizationName,
    dataLoadingState,
    dataError,
    isUsingSupabaseData,
    reloadSupabaseData,
    selectedSiteFilter,
    setSelectedSiteFilter,
    selectedContractorFilter,
    setSelectedContractorFilter,
  } = useDocuCrew();

  // Modals state
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [isNewWorkerOpen, setIsNewWorkerOpen] = useState(false);
  const [isNewContractorOpen, setIsNewContractorOpen] = useState(false);
  const [isNewSiteOpen, setIsNewSiteOpen] = useState(false);
  const [isNewDocTypeOpen, setIsNewDocTypeOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Filtered workers based on global dashboard selectors
  const filteredWorkers = useMemo(() => {
    return workers.filter((worker) => {
      const matchSite =
        selectedSiteFilter === 'ALL' || worker.siteIds.includes(selectedSiteFilter);
      const matchContractor =
        selectedContractorFilter === 'ALL' || worker.contractorId === selectedContractorFilter;
      return matchSite && matchContractor;
    });
  }, [workers, selectedSiteFilter, selectedContractorFilter]);

  // Filtered documents based on global dashboard selectors
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchSite =
        selectedSiteFilter === 'ALL' || doc.siteId === selectedSiteFilter;
      const matchContractor =
        selectedContractorFilter === 'ALL' || doc.contractorId === selectedContractorFilter;
      return matchSite && matchContractor;
    });
  }, [documents, selectedSiteFilter, selectedContractorFilter]);

  // Executive KPI stats derived from real filtered dataset
  const indicators = useMemo(() => {
    return calculateIndicators(filteredWorkers, filteredDocuments);
  }, [filteredWorkers, filteredDocuments]);

  // Filtered blocked workers for critical block list
  const blockedWorkersList = useMemo(() => {
    return filteredWorkers.filter((w) => w.status === 'BLOQUEADO');
  }, [filteredWorkers]);

  // Recent high-priority alerts
  const recentAlerts = useMemo(() => {
    return alerts
      .filter((a) => {
        if (selectedContractorFilter !== 'ALL') {
          const contractor = contractors.find((c) => c.id === selectedContractorFilter);
          if (contractor && a.contractorName !== contractor.tradeName && a.contractorName !== contractor.name) {
            return false;
          }
        }
        return true;
      })
      .slice(0, 5);
  }, [alerts, selectedContractorFilter, contractors]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Discreet Data State Notification Banners */}
      {dataLoadingState === 'LOADING' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs animate-pulse">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            <span className="font-semibold">
              Sincronizando dados operacionais da organização “{organizationName}”...
            </span>
          </div>
          <span className="text-[11px] text-amber-700">Aguarde</span>
        </div>
      )}

      {dataLoadingState === 'ERROR' && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              Aviso de sincronização com o banco. Exibindo dados locais com segurança.{' '}
              {dataError && <span className="font-medium text-rose-700">({dataError})</span>}
            </span>
          </div>
          <button
            onClick={() => reloadSupabaseData()}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium text-xs flex items-center gap-1 transition-colors shrink-0 ml-2"
          >
            <RefreshCw className="w-3 h-3" />
            Tentar novamente
          </button>
        </div>
      )}

      {dataLoadingState === 'ORG_NOT_FOUND' && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Organização vinculada: <strong>{organizationName}</strong>. Dados operacionais carregados com sucesso.
            </span>
          </div>
        </div>
      )}

      {dataLoadingState === 'EMPTY' && (
        <div className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              Nenhum trabalhador ou documento cadastrado para <strong>{organizationName}</strong>. Exibindo estrutura operacional pronta para novos cadastros.
            </span>
          </div>
        </div>
      )}

      {/* Top Filter Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#DCE4EC] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-[#061E2E] text-[#FFC400] border border-[#0B2A3F]">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#102033]">Filtro de Visão Operacional</h2>
              {isUsingSupabaseData && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#00A878]/10 text-[#00A878] border border-[#00A878]/30">
                  <CheckCircle2 className="w-3 h-3" />
                  {organizationName}
                </span>
              )}
            </div>
            <p className="text-xs text-[#587087]">
              Filtre os indicadores de conformidade e prontuários por obra e empresa contratada
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Site Filter */}
          <div className="flex-1 sm:flex-initial min-w-[200px]">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#587087] mb-1">
              Obra / Contrato
            </label>
            <select
              value={selectedSiteFilter}
              onChange={(e) => setSelectedSiteFilter(e.target.value)}
              className="w-full text-xs font-semibold bg-[#F5F7FA] border border-[#DCE4EC] rounded-xl px-3 py-2 text-[#102033] focus:ring-2 focus:ring-[#061E2E] focus:outline-none transition-colors"
            >
              <option value="ALL">Todas as Obras ({worksites.length})</option>
              {worksites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name} ({site.code})
                </option>
              ))}
            </select>
          </div>

          {/* Contractor Filter */}
          <div className="flex-1 sm:flex-initial min-w-[200px]">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#587087] mb-1">
              Empresa Terceirizada
            </label>
            <select
              value={selectedContractorFilter}
              onChange={(e) => setSelectedContractorFilter(e.target.value)}
              className="w-full text-xs font-semibold bg-[#F5F7FA] border border-[#DCE4EC] rounded-xl px-3 py-2 text-[#102033] focus:ring-2 focus:ring-[#061E2E] focus:outline-none transition-colors"
            >
              <option value="ALL">Todas as Terceirizadas ({contractors.length})</option>
              {contractors.map((cont) => (
                <option key={cont.id} value={cont.id}>
                  {cont.tradeName}
                </option>
              ))}
            </select>
          </div>

          {(selectedSiteFilter !== 'ALL' || selectedContractorFilter !== 'ALL') && (
            <div className="self-end pb-1">
              <button
                onClick={() => {
                  setSelectedSiteFilter('ALL');
                  setSelectedContractorFilter('ALL');
                }}
                className="text-xs text-[#061E2E] hover:text-[#FFC400] font-bold px-2 py-1 transition-colors"
              >
                Limpar filtros
              </button>
            </div>
          )}

          {/* Quick Actions & Reports */}
          <div className="flex items-center gap-2 self-end">
            <button
              onClick={() => setIsReportOpen(true)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Exportar Relatório</span>
            </button>

            <QuickActionsMenu
              onOpenUploadDoc={() => setIsUploadDocOpen(true)}
              onOpenNewWorker={() => setIsNewWorkerOpen(true)}
              onOpenNewContractor={() => setIsNewContractorOpen(true)}
              onOpenNewSite={() => setIsNewSiteOpen(true)}
              onOpenNewDocType={() => setIsNewDocTypeOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* 6 Executive Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="Total Trabalhadores"
          value={indicators.totalWorkers}
          subtitle="Cadastrados no escopo"
          icon={Users}
          variant="default"
        />
        <StatCard
          title="Liberados (Aptos)"
          value={indicators.releasedWorkers}
          subtitle={`${indicators.complianceRate}% de conformidade`}
          icon={ShieldCheck}
          variant="success"
        />
        <StatCard
          title="Bloqueados"
          value={indicators.blockedWorkers}
          subtitle="Trabalhador bloqueado para atuação"
          icon={ShieldAlert}
          variant="danger"
        />
        <StatCard
          title="Docs Vencidos"
          value={indicators.expiredDocuments}
          subtitle="Requer substituição imediata"
          icon={AlertTriangle}
          variant="danger"
        />
        <StatCard
          title="A Vencer (30 dias)"
          value={indicators.expiringDocuments}
          subtitle="Alerta prévio emitido"
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Aguardando Análise"
          value={indicators.underReviewDocuments}
          subtitle="Documentos aguardando conferência"
          icon={FileCheck2}
          variant="info"
        />
      </div>

      {/* Main Grid: Critical Blockages & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Blocking Issues Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#DCE4EC] shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[#DCE4EC] flex items-center justify-between bg-[#F5F7FA]">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E9304F]"></span>
                <h3 className="text-sm sm:text-base font-bold text-[#102033]">
                  Trabalhadores Bloqueados & Motivos de Bloqueio
                </h3>
              </div>
              <p className="text-xs text-[#587087] mt-0.5">
                Identificação imediata de inconformidades, pendências documentais e ações necessárias
              </p>
            </div>
            <Link
              to="/trabalhadores?status=BLOQUEADO"
              className="text-xs font-bold text-[#061E2E] hover:text-[#B45309] flex items-center gap-1 shrink-0"
            >
              Ver todos os {indicators.blockedWorkers} bloqueados &rarr;
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            {blockedWorkersList.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="Nenhum trabalhador bloqueado neste filtro!"
                description="Todos os trabalhadores selecionados possuem 100% da documentação obrigatória em conformidade."
              />
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#DCE4EC] bg-[#F5F7FA] text-[#587087] font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Trabalhador / Função</th>
                    <th className="py-3.5 px-4">Terceirizada</th>
                    <th className="py-3.5 px-4">Motivo do Bloqueio</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE4EC]/70 text-[#102033]">
                  {blockedWorkersList.map((worker) => (
                    <tr key={worker.id} className="hover:bg-[#E9304F]/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#061E2E] text-[#FFC400] font-black flex items-center justify-center text-xs shrink-0 border border-[#0B2A3F]">
                            {worker.avatarInitials}
                          </div>
                          <div>
                            <p className="font-bold text-[#102033] text-xs">{worker.name}</p>
                            <p className="text-[11px] text-[#587087]">{worker.role}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-[#102033]">
                        {worker.contractorName}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-1.5 text-[#E9304F] bg-[#E9304F]/10 px-2.5 py-1.5 rounded-lg border border-[#E9304F]/25 max-w-sm">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#E9304F]" />
                          <span className="text-xs font-semibold leading-snug">
                            {worker.blockReason || 'Pendência documental obrigatória'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Badge status="BLOQUEADO" variant="worker" />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/documentos?worker=${encodeURIComponent(worker.name)}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#061E2E] text-white font-bold text-[11px] hover:bg-[#0B2A3F] transition-colors shadow-xs"
                        >
                          Analisar Docs
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-3 bg-[#F5F7FA] border-t border-[#DCE4EC] text-xs text-[#587087] flex items-center justify-between">
            <span className="font-semibold text-[#102033]">Regra de Segurança Ativa:</span>
            <span>Trabalhador bloqueado para atuação quando possuir NRs ou ASO vencidos/pendentes</span>
          </div>
        </div>

        {/* Right 1 Col: Recent Alerts & Compliance by Contractor */}
        <div className="space-y-6">
          {/* Alerts Card */}
          <div className="bg-white rounded-2xl border border-[#DCE4EC] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#DCE4EC] flex items-center justify-between bg-[#F5F7FA]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D97706]" />
                <h3 className="text-sm font-bold text-[#102033]">Alertas Recentes</h3>
              </div>
              <Link to="/alertas" className="text-xs text-[#061E2E] hover:text-[#B45309] font-bold">
                Ver todos &rarr;
              </Link>
            </div>

            <div className="divide-y divide-[#DCE4EC]/70 max-h-[380px] overflow-y-auto">
              {recentAlerts.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#587087]">
                  Nenhum alerta registrado no momento.
                </div>
              ) : (
                recentAlerts.map((alert) => (
                  <div key={alert.id} className="p-3.5 hover:bg-[#F5F7FA] transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <Badge status={alert.severity} variant="alert" />
                      <span className="text-[10px] text-[#587087] font-mono">{alert.createdAt}</span>
                    </div>
                    <h4 className="text-xs font-bold text-[#102033] mt-1">{alert.title}</h4>
                    <p className="text-[11px] text-[#587087] mt-0.5 leading-relaxed">
                      {alert.description}
                    </p>
                    <div className="mt-2 pt-2 border-t border-[#DCE4EC]/60 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#102033]">{alert.contractorName}</span>
                      <span className="text-[#587087] text-[10px] italic">
                        {alert.actionRequired}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Compliance Summary by Contractor */}
          <div className="bg-white rounded-2xl border border-[#DCE4EC] shadow-xs p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#587087] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#061E2E]" />
                Conformidade por Terceirizada
              </h3>
              <Link to="/terceirizadas" className="text-xs text-[#061E2E] font-bold hover:underline">
                Gerenciar
              </Link>
            </div>

            <div className="space-y-3">
              {contractors.map((contractor) => (
                <div key={contractor.id} className="p-3 rounded-xl bg-[#F5F7FA] border border-[#DCE4EC]">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-[#102033] truncate max-w-[170px]">
                      {contractor.tradeName}
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        contractor.complianceRate === 100
                          ? 'text-[#00A878]'
                          : contractor.complianceRate >= 50
                          ? 'text-[#D97706]'
                          : 'text-[#E9304F]'
                      }`}
                    >
                      {contractor.complianceRate}% apto
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mb-2">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        contractor.complianceRate === 100
                          ? 'bg-[#00A878]'
                          : contractor.complianceRate >= 50
                          ? 'bg-[#FFC400]'
                          : 'bg-[#E9304F]'
                      }`}
                      style={{ width: `${contractor.complianceRate}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#587087]">
                    <span>
                      {contractor.activeWorkers}/{contractor.totalWorkers} trabalhadores liberados
                    </span>
                    <Badge status={contractor.status} variant="contractor" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Summary: Obras Status */}
      <div className="bg-white rounded-2xl border border-[#DCE4EC] shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#061E2E]" />
            <h3 className="text-sm font-bold text-[#102033]">Visão Geral dos Contratos e Obras</h3>
          </div>
          <Link to="/obras" className="text-xs text-[#061E2E] font-bold hover:underline">
            Ver todas as obras &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {worksites.map((site) => (
            <div
              key={site.id}
              className="p-4 rounded-xl border border-[#DCE4EC] hover:border-[#061E2E]/40 transition-all bg-white flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#061E2E] bg-[#F5F7FA] px-2 py-0.5 rounded border border-[#DCE4EC]">
                    {site.code}
                  </span>
                  <span className="text-xs font-bold text-[#102033]">
                    {site.complianceRate}% Conforme
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#102033] leading-snug">{site.name}</h4>
                <p className="text-xs text-[#587087] mt-0.5">{site.clientName}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#DCE4EC] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#587087]">Alocações neste contrato:</span>
                  <span className="font-bold text-[#102033]">
                    <span className="text-[#00A878]">{site.releasedWorkers} aptos</span> /{' '}
                    <span className="text-[#E9304F]">{site.blockedWorkers} bloqueados</span>
                  </span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#00A878] h-1.5 rounded-full"
                    style={{ width: `${site.complianceRate}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Modals */}
      {isUploadDocOpen && (
        <UploadDocumentModal
          isOpen={isUploadDocOpen}
          onClose={() => setIsUploadDocOpen(false)}
        />
      )}

      {isNewWorkerOpen && (
        <CreateWorkerModal
          isOpen={isNewWorkerOpen}
          onClose={() => setIsNewWorkerOpen(false)}
        />
      )}

      {isNewContractorOpen && (
        <CreateContractorModal
          isOpen={isNewContractorOpen}
          onClose={() => setIsNewContractorOpen(false)}
        />
      )}

      {isNewSiteOpen && (
        <CreateSiteModal
          isOpen={isNewSiteOpen}
          onClose={() => setIsNewSiteOpen(false)}
        />
      )}

      {isNewDocTypeOpen && (
        <CreateDocumentTypeModal
          isOpen={isNewDocTypeOpen}
          onClose={() => setIsNewDocTypeOpen(false)}
        />
      )}

      {isReportOpen && (
        <PrintReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          reportType="DASHBOARD_EXECUTIVE"
          organizationName={organizationName}
          workers={filteredWorkers}
          contractors={contractors}
          worksites={worksites}
          documents={filteredDocuments}
          alerts={alerts}
          indicators={indicators}
        />
      )}
    </div>
  );
};
