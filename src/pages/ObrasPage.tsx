import React, { useState } from 'react';
import { useDocuCrew } from '../context/DocuCrewContext';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { WorkSite, Worker } from '../types';
import {
  Briefcase,
  MapPin,
  Calendar,
  Building2,
  Users,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileCheck2,
  CheckCircle2,
  Eye,
  Plus,
  Printer,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CreateSiteModal } from '../components/modals/CreateSiteModal';
import { PrintReportModal } from '../components/reports/PrintReportModal';

export const ObrasPage: React.FC = () => {
  const { worksites, contractors, workers, organizationName } = useDocuCrew();
  const [selectedSite, setSelectedSite] = useState<WorkSite | null>(null);
  const [isCreateSiteOpen, setIsCreateSiteOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const getSiteWorkers = (siteId: string): Worker[] => {
    return workers.filter((w) => w.siteIds.includes(siteId));
  };

  const getContractorNames = (contractorIds: string[]) => {
    return contractorIds
      .map((id) => contractors.find((c) => c.id === id)?.tradeName)
      .filter(Boolean);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            Obras, Contratos & Frentes de Serviço
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão centralizada de conformidade por cliente, local de trabalho e exigências normativas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateSiteOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            Nova Obra ou Contrato
          </button>
          <div className="text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 font-semibold">
            {worksites.length} Contratos Ativos
          </div>
        </div>
      </div>

      {/* Sites Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {worksites.map((site) => {
          const siteWorkers = getSiteWorkers(site.id);
          const aptCount = siteWorkers.filter((w) => w.status === 'LIBERADO').length;
          const blqCount = siteWorkers.filter((w) => w.status === 'BLOQUEADO').length;
          const contractorList = getContractorNames(site.contractorIds);

          return (
            <div
              key={site.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-slate-100 bg-gradient-to-b from-slate-50/70 to-white">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {site.code}
                  </span>
                  <span
                    className={`font-mono text-xs font-bold ${
                      site.complianceRate >= 70
                        ? 'text-emerald-600'
                        : site.complianceRate >= 50
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {site.complianceRate}% Conforme
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">{site.name}</h3>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">{site.clientName}</p>

                <div className="mt-3 flex items-start gap-1.5 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-tight">{site.location}</span>
                </div>

                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-[11px]">
                    Período: {site.startDate} até {site.endDate}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4 flex-1">
                {/* Workers Status Bar */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-700">Trabalhadores Alocados:</span>
                    <span className="font-mono text-slate-900 font-bold">{siteWorkers.length}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-2 transition-all"
                      style={{
                        width: `${(aptCount / (siteWorkers.length || 1)) * 100}%`,
                      }}
                      title={`${aptCount} trabalhadores liberados`}
                    />
                    <div
                      className="bg-rose-500 h-2 transition-all"
                      style={{
                        width: `${(blqCount / (siteWorkers.length || 1)) * 100}%`,
                      }}
                      title={`${blqCount} trabalhadores bloqueados`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] mt-1.5 text-slate-500">
                    <span className="text-emerald-700 font-semibold">{aptCount} Liberados</span>
                    <span className="text-rose-700 font-semibold">{blqCount} Bloqueados</span>
                  </div>
                </div>

                {/* Contractors in this site */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">
                    Terceirizadas Vinculadas ({contractorList.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {contractorList.map((name, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium border border-slate-200"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Specific Requirements Tag */}
                <div className="p-2.5 rounded-xl bg-blue-50/40 border border-blue-100">
                  <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block mb-1">
                    Exigências Específicas do Cliente:
                  </span>
                  <ul className="text-[11px] text-blue-800 space-y-0.5 list-disc list-inside">
                    {site.specificRequirements.slice(0, 2).map((req, i) => (
                      <li key={i} className="truncate">
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {blqCount > 0 ? (
                    <strong className="text-rose-600 font-bold">{blqCount} pendências</strong>
                  ) : (
                    <strong className="text-emerald-600 font-bold">100% regular</strong>
                  )}
                </span>
                <button
                  onClick={() => setSelectedSite(site)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Ver Detalhes
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* WorkSite Details Modal */}
      {selectedSite && (
        <Modal
          isOpen={!!selectedSite}
          onClose={() => setSelectedSite(null)}
          title={`Detalhamento de Obra: ${selectedSite.name}`}
          subtitle={`${selectedSite.code} • Cliente: ${selectedSite.clientName}`}
          maxWidth="3xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => setIsReportOpen(true)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#061E2E] hover:bg-[#092B42] text-white flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Relatório da Obra (PDF)
              </button>
              <button
                onClick={() => setSelectedSite(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800"
              >
                Fechar
              </button>
            </div>
          }
        >
          <div className="space-y-5 text-xs">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">Conformidade Global</span>
                <p className="text-xl font-extrabold text-slate-900 mt-0.5">{selectedSite.complianceRate}%</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-emerald-900">
                <span className="text-[10px] uppercase font-bold text-emerald-700">Trabalhadores Aptos</span>
                <p className="text-xl font-extrabold text-emerald-800 mt-0.5">
                  {getSiteWorkers(selectedSite.id).filter((w) => w.status === 'LIBERADO').length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center text-rose-900">
                <span className="text-[10px] uppercase font-bold text-rose-700">Bloqueados na Obra</span>
                <p className="text-xl font-extrabold text-rose-800 mt-0.5">
                  {getSiteWorkers(selectedSite.id).filter((w) => w.status === 'BLOQUEADO').length}
                </p>
              </div>
            </div>

            {/* Specific Rules */}
            <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100">
              <h4 className="font-bold text-blue-950 mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                Matriz de Requisitos Obrigatórios para esta Obra
              </h4>
              <ul className="space-y-1 text-blue-900 text-xs">
                {selectedSite.specificRequirements.map((req, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Workers List in this Site */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2">
                Trabalhadores Escalados nesta Obra ({getSiteWorkers(selectedSite.id).length})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {getSiteWorkers(selectedSite.id).map((w) => (
                  <div key={w.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <p className="font-bold text-slate-900">{w.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {w.role} • {w.contractorName}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {w.blockReason && (
                        <span className="text-[11px] text-rose-600 max-w-xs truncate hidden sm:inline">
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

      {/* Create Site Modal */}
      {isCreateSiteOpen && (
        <CreateSiteModal
          isOpen={isCreateSiteOpen}
          onClose={() => setIsCreateSiteOpen(false)}
        />
      )}

      {/* Site Operational Report Print Modal */}
      {isReportOpen && selectedSite && (
        <PrintReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          reportType="SITE_OPERATIONAL"
          organizationName={organizationName}
          workSite={selectedSite}
          workers={workers}
        />
      )}
    </div>
  );
};
