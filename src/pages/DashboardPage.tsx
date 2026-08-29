import React, { useMemo } from 'react';
import { useDocuCrew } from '../context/DocuCrewContext';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Link } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  FileCheck2,
  Filter,
  ArrowRight,
  Building2,
  Briefcase,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Search,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    contractors,
    worksites,
    workers,
    documents,
    alerts,
    selectedSiteFilter,
    setSelectedSiteFilter,
    selectedContractorFilter,
    setSelectedContractorFilter,
  } = useDocuCrew();

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

  // Key KPI stats
  const totalWorkersCount = filteredWorkers.length;
  const releasedWorkersCount = filteredWorkers.filter((w) => w.status === 'LIBERADO').length;
  const blockedWorkersCount = filteredWorkers.filter((w) => w.status === 'BLOQUEADO').length;

  const expiredDocsCount = filteredDocuments.filter((d) => d.status === 'VENCIDO').length;
  const expiringSoonDocsCount = filteredDocuments.filter((d) => d.status === 'PROXIMO_VENCIMENTO').length;
  const underReviewDocsCount = filteredDocuments.filter((d) => d.status === 'AGUARDANDO_ANALISE').length;

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
          if (contractor && a.contractorName !== contractor.tradeName) return false;
        }
        return true;
      })
      .slice(0, 5);
  }, [alerts, selectedContractorFilter, contractors]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Filter Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Filtro de Visão Operacional</h2>
            <p className="text-xs text-slate-500">
              Personalize os indicadores e relatórios por obra e prestadora
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Site Filter */}
          <div className="flex-1 sm:flex-initial min-w-[200px]">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Obra / Contrato
            </label>
            <select
              value={selectedSiteFilter}
              onChange={(e) => setSelectedSiteFilter(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-colors"
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
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Empresa Terceirizada
            </label>
            <select
              value={selectedContractorFilter}
              onChange={(e) => setSelectedContractorFilter(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none transition-colors"
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
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 hover:underline"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 6 Executive Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="Total Trabalhadores"
          value={totalWorkersCount}
          subtitle="Cadastrados no escopo"
          icon={Users}
          variant="default"
        />
        <StatCard
          title="Liberados (Aptos)"
          value={releasedWorkersCount}
          subtitle={`${Math.round((releasedWorkersCount / (totalWorkersCount || 1)) * 100)}% de conformidade`}
          icon={ShieldCheck}
          variant="success"
        />
        <StatCard
          title="Bloqueados"
          value={blockedWorkersCount}
          subtitle="Trabalhador bloqueado para atuação"
          icon={ShieldAlert}
          variant="danger"
        />
        <StatCard
          title="Docs Vencidos"
          value={expiredDocsCount}
          subtitle="Requer substituição imediata"
          icon={AlertTriangle}
          variant="danger"
        />
        <StatCard
          title="A Vencer (30 dias)"
          value={expiringSoonDocsCount}
          subtitle="Alerta prévio emitido"
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Aguardando Análise"
          value={underReviewDocsCount}
          subtitle="Documentos aguardando conferência"
          icon={FileCheck2}
          variant="info"
        />
      </div>

      {/* Main Grid: Critical Blockages & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Blocking Issues Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Trabalhadores Bloqueados & Motivos de Bloqueio
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Identificação imediata de inconformidades, pendências documentais e ações necessárias
              </p>
            </div>
            <Link
              to="/trabalhadores?status=BLOQUEADO"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 shrink-0"
            >
              Ver todos os {blockedWorkersCount} bloqueados &rarr;
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
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Trabalhador / Função</th>
                    <th className="py-3 px-4">Terceirizada</th>
                    <th className="py-3 px-4">Motivo do Bloqueio</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {blockedWorkersList.map((worker) => (
                    <tr key={worker.id} className="hover:bg-rose-50/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-200">
                            {worker.avatarInitials}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{worker.name}</p>
                            <p className="text-[11px] text-slate-500">{worker.role}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {worker.contractorName}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-1.5 text-rose-700 bg-rose-50/80 px-2.5 py-1.5 rounded-lg border border-rose-200/60 max-w-sm">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
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
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 text-white font-medium text-[11px] hover:bg-slate-800 transition-colors"
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

          <div className="p-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span className="font-medium">Regra de Segurança Ativa:</span>
            <span>Trabalhador bloqueado para atuação quando possuir NRs ou ASO vencidos/pendentes</span>
          </div>
        </div>

        {/* Right 1 Col: Recent Alerts & Compliance by Contractor */}
        <div className="space-y-6">
          {/* Alerts Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Alertas Recentes</h3>
              </div>
              <Link to="/alertas" className="text-xs text-blue-600 hover:text-blue-800 font-bold">
                Ver todos &rarr;
              </Link>
            </div>

            <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
              {recentAlerts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Nenhum alerta registrado no momento.
                </div>
              ) : (
                recentAlerts.map((alert) => (
                  <div key={alert.id} className="p-3.5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <Badge status={alert.severity} variant="alert" />
                      <span className="text-[10px] text-slate-400 font-mono">{alert.createdAt}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mt-1">{alert.title}</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      {alert.description}
                    </p>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="font-medium text-slate-700">{alert.contractorName}</span>
                      <span className="text-slate-500 text-[10px] italic">
                        {alert.actionRequired}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Compliance Summary by Contractor */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Conformidade por Terceirizada
              </h3>
              <Link to="/terceirizadas" className="text-xs text-blue-600 font-semibold hover:underline">
                Gerenciar
              </Link>
            </div>

            <div className="space-y-3">
              {contractors.map((contractor) => (
                <div key={contractor.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900 truncate max-w-[170px]">
                      {contractor.tradeName}
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        contractor.complianceRate === 100
                          ? 'text-emerald-600'
                          : contractor.complianceRate >= 50
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {contractor.complianceRate}% apto
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mb-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        contractor.complianceRate === 100
                          ? 'bg-emerald-500'
                          : contractor.complianceRate >= 50
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${contractor.complianceRate}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Visão Geral dos Contratos e Obras</h3>
          </div>
          <Link to="/obras" className="text-xs text-blue-600 font-bold hover:underline">
            Ver todas as obras &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {worksites.map((site) => (
            <div
              key={site.id}
              className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-all bg-gradient-to-b from-white to-slate-50/50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {site.code}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {site.complianceRate}% Conforme
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">{site.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{site.clientName}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Alocações neste contrato:</span>
                  <span className="font-semibold text-slate-900">
                    <span className="text-emerald-600">{site.releasedWorkers} aptos</span> /{' '}
                    <span className="text-rose-600">{site.blockedWorkers} bloqueados</span>
                  </span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full"
                    style={{ width: `${site.complianceRate}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
