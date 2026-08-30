import React, { useState } from 'react';
import { useDocuCrew } from '../context/DocuCrewContext';
import { useAuth } from '../context/AuthContext';
import {
  Settings,
  Building,
  FileCode2,
  BellRing,
  CheckCircle2,
  Plus,
  Edit2,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Layers,
  Database,
  Info,
  Save,
} from 'lucide-react';
import { CreateDocumentTypeModal } from '../components/modals/CreateDocumentTypeModal';
import { DocumentTypeDefinition } from '../types';

export const ConfiguracoesPage: React.FC = () => {
  const {
    documentTypes,
    organizationId,
    organizationName,
    updateOrgProfile,
    editDocumentType,
    isUsingSupabaseData,
  } = useDocuCrew();

  const { user, isConfigured, supabaseUrl } = useAuth();

  const [activeTab, setActiveTab] = useState<'PERFIL_EMPRESA' | 'DOCUMENTOS' | 'REGRAS'>('PERFIL_EMPRESA');

  // Organization Profile Form State
  const [orgName, setOrgName] = useState(organizationName);
  const [orgSlug, setOrgSlug] = useState(organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-'));
  const [isSavingOrg, setIsSavingOrg] = useState(false);

  // Document Type Modal State
  const [isDocTypeModalOpen, setIsDocTypeModalOpen] = useState(false);
  const [selectedDocTypeForEdit, setSelectedDocTypeForEdit] = useState<DocumentTypeDefinition | null>(null);

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    setIsSavingOrg(true);
    await updateOrgProfile({
      name: orgName.trim(),
      slug: orgSlug.trim(),
    });
    setIsSavingOrg(false);
  };

  const handleToggleDocTypeActive = async (docType: DocumentTypeDefinition) => {
    await editDocumentType(docType.id, {
      isActive: !docType.isActive,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Configurações & Parâmetros Operacionais
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão da empresa assinante, matriz de documentos obrigatórios e prazos de conformidade
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
          <span className="font-semibold">Organização:</span>
          <span className="font-bold text-slate-900">{organizationName}</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto">
        {[
          { id: 'PERFIL_EMPRESA', label: 'Perfil da Empresa', icon: Building },
          { id: 'DOCUMENTOS', label: 'Tipos de Documentos', icon: FileCode2 },
          { id: 'REGRAS', label: 'Regras & Parâmetros de SST', icon: BellRing },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PERFIL DA EMPRESA */}
      {activeTab === 'PERFIL_EMPRESA' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              Dados da Empresa Assinante
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Informações cadastrais e de identificação corporativa no DocuCrew
            </p>
          </div>

          <form onSubmit={handleSaveOrg} className="space-y-4 max-w-2xl text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-800 mb-1">
                  Razão Social / Nome da Organização <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Identificador / Slug do Sistema
                </label>
                <input
                  type="text"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  ID da Organização (Supabase)
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={organizationId || 'Modo Demonstração (Demo Org)'}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-600 font-mono text-[11px] select-all cursor-not-allowed"
                />
              </div>
            </div>

            {/* Status do Banco */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-900">Integração com Supabase:</span>
                {isUsingSupabaseData ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    🟢 Conectado ao Schema Real
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    🟡 Ambiente Local / Demonstração
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Todas as consultas e atualizações operacionais são isoladas estritamente por <code>organization_id</code>.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingOrg}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#061E2E] hover:bg-[#092B42] text-white transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                {isSavingOrg ? 'Salvando...' : 'Salvar Alterações da Empresa'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: TIPOS DE DOCUMENTOS */}
      {activeTab === 'DOCUMENTOS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-blue-600" />
                Matriz de Requisitos Documentais & NRs
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tipos de documentos exigidos, regras de validade periódica e bloqueio automático
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedDocTypeForEdit(null);
                setIsDocTypeModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Tipo de Documento
            </button>
          </div>

          {/* Document Types Grid / Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documentTypes.map((dt) => (
              <div
                key={dt.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  dt.isActive
                    ? 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                    : 'border-slate-200 bg-slate-50/70 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                      {dt.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        dt.isMandatory
                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {dt.isMandatory ? 'Obrigatório' : 'Opcional'}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-xs">{dt.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {dt.description || 'Sem orientações cadastradas para este documento.'}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Validade:</span>
                      <span className="font-semibold text-slate-900">
                        {dt.validityDays ? `${Math.round(dt.validityDays / 30)} meses (${dt.validityDays} dias)` : 'Indeterminada'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Alerta Prévio:</span>
                      <span className="font-semibold text-slate-900">
                        {dt.earlyAlertDays || 30} dias antes
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleDocTypeActive(dt)}
                    className={`text-[11px] font-semibold px-2 py-1 rounded-lg ${
                      dt.isActive
                        ? 'text-slate-600 hover:bg-slate-100'
                        : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {dt.isActive ? 'Desativar' : 'Ativar'}
                  </button>

                  <button
                    onClick={() => {
                      setSelectedDocTypeForEdit(dt);
                      setIsDocTypeModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: REGRAS DE SST */}
      {activeTab === 'REGRAS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BellRing className="w-4 h-4 text-blue-600" />
              Parâmetros de Alertas e Regras de Bloqueio Automático
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Definição dos critérios de conformidade técnica e travas de segurança operacional
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Bloqueio Imediato por ASO ou NR Vencida
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Trabalhadores com documentos obrigatórios com validade ultrapassada entram instantaneamente no status <strong>BLOQUEADO</strong>, impedindo o acesso físico e emissão de permissão de trabalho (PT).
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Clock className="w-4 h-4 text-amber-600" />
                Janela Preventiva de Aviso (30 Dias)
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Notificações preventivas são disparadas automaticamente para os responsáveis das terceirizadas 30 dias antes do vencimento de qualquer certificado.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Document Type Modal */}
      {isDocTypeModalOpen && (
        <CreateDocumentTypeModal
          isOpen={isDocTypeModalOpen}
          onClose={() => {
            setIsDocTypeModalOpen(false);
            setSelectedDocTypeForEdit(null);
          }}
          initialData={selectedDocTypeForEdit}
        />
      )}
    </div>
  );
};
