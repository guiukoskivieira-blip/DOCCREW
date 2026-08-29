import React, { useState } from 'react';
import { useDocuCrew } from '../context/DocuCrewContext';
import {
  Settings,
  Users,
  Shield,
  FileCode2,
  Briefcase,
  BellRing,
  Building,
  CheckCircle2,
  Lock,
  Plus,
  Radio,
  Sliders,
  Layers,
  Sparkles,
  Cpu,
  Palette,
} from 'lucide-react';
import { DocuCrewLogo, DocuCrewIcon } from '../components/common/DocuCrewLogo';

export const ConfiguracoesPage: React.FC = () => {
  const { users, documentTypes } = useDocuCrew();

  const [activeTab, setActiveTab] = useState<
    'USUARIOS' | 'PERFIS' | 'DOCUMENTOS' | 'FUNCOES' | 'REGRAS' | 'ORGANIZACAO'
  >('USUARIOS');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Configurações & Parâmetros do DocuCrew
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Definição de regras de segurança, matriz de treinamentos por função e políticas corporativas
          </p>
        </div>

        <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 font-mono">
          Versão do Esquema: v1.4.0 (Protótipo B2B)
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto">
        {[
          { id: 'USUARIOS', label: 'Usuários e Acessos', icon: Users },
          { id: 'PERFIS', label: 'Perfis & Permissões', icon: Shield },
          { id: 'DOCUMENTOS', label: 'Tipos de Documentos', icon: FileCode2 },
          { id: 'FUNCOES', label: 'Funções & Matriz de NRs', icon: Briefcase },
          { id: 'REGRAS', label: 'Regras & Notificações', icon: BellRing },
          { id: 'ORGANIZACAO', label: 'Dados da Organização', icon: Building },
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

      {/* TAB CONTENT */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        {/* 1. USUARIOS */}
        {activeTab === 'USUARIOS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Usuários do Sistema</h3>
                <p className="text-xs text-slate-500">Membros da equipe com acesso ao painel do DocuCrew</p>
              </div>
              <button
                onClick={() => alert('Simulação: Abertura do formulário de convite de novo usuário.')}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Novo Usuário
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
              {users.map((u) => (
                <div key={u.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-xs">
                      {u.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{u.name}</p>
                      <p className="text-[11px] text-slate-500">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {u.role.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                      Último acesso: {u.lastAccess}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Ativo" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. PERFIS & PERMISSOES */}
        {activeTab === 'PERFIS' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Perfis de Acesso e Alçadas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: 'Administrador Geral',
                  desc: 'Acesso irrestrito a configurações, parametrização de obras, exclusão e auditoria.',
                  badge: 'Acesso Total',
                },
                {
                  title: 'Fiscal de Segurança (TST / Engenharia)',
                  desc: 'Aprovação técnica de NRs e ASOs, recusa com justificativa, bloqueio na catraca.',
                  badge: 'Homologação Técnica',
                },
                {
                  title: 'Analista Documental (RH / Jurídico)',
                  desc: 'Verificação de vínculos CLT, eSocial, CNH e certidões negativas corporativas.',
                  badge: 'Validação Contratual',
                },
                {
                  title: 'Consulta / Portaria de Obra',
                  desc: 'Visualização apenas de liberação/bloqueio para controle físico de portão e catraca.',
                  badge: 'Somente Leitura',
                },
              ].map((p, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">{p.title}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. TIPOS DE DOCUMENTOS */}
        {activeTab === 'DOCUMENTOS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Catálogo de Documentos Exigidos</h3>
                <p className="text-xs text-slate-500">Periodicidade de vigência e obrigatoriedade cadastral</p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
              {documentTypes.map((dt) => (
                <div key={dt.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="font-bold text-slate-900">{dt.name}</p>
                    <p className="text-[11px] text-slate-500">
                      Categoria: <strong>{dt.category}</strong> • Obrigatoriedade:{' '}
                      <strong>{dt.isMandatory ? 'Sim (Bloqueante)' : 'Opcional'}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      Validade: {dt.validityMonths ? `${dt.validityMonths} meses` : 'Não se aplica'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. FUNCOES & MATRIZ */}
        {activeTab === 'FUNCOES' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Matriz de Treinamentos Obrigatórios por Função</h3>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {[
                { role: 'Eletricista de Manutenção', nrs: ['ASO com Aptidão Elétrica', 'NR-10 (Básico 40h)', 'NR-35 (Altura 8h)', 'Ficha de EPI'] },
                { role: 'Soldador TIG / Caldeireiro', nrs: ['ASO Específico', 'NR-33 (Espaço Confinado 16h)', 'NR-35 (Altura 8h)', 'Qualificação Soldagem ASME/AWS'] },
                { role: 'Técnico em Refrigeração (HVAC)', nrs: ['ASO com Altura', 'NR-35 (Altura)', 'NR-10 (Segurança Elétrica)', 'Registro CFT'] },
                { role: 'Montador de Estruturas Metálicas', nrs: ['ASO com Aptidão Altura', 'NR-35 (Trabalho em Altura)', 'Ficha de EPI Completa', 'Registro CLT'] },
                { role: 'Pintor Industrial / Airless', nrs: ['ASO Ocupacional (Espirometria)', 'NR-35 (Altura)', 'Ficha de EPI Respiratória'] },
              ].map((m, i) => (
                <div key={i} className="p-3.5 hover:bg-slate-50 space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">{m.role}</h4>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {m.nrs.map((nr, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-medium text-[11px] border border-blue-200">
                        ✓ {nr}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. REGRAS & NOTIFICACOES */}
        {activeTab === 'REGRAS' && (
          <div className="space-y-5 text-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Regras Automáticas de Alerta Preventivo</h3>
              <p className="text-slate-500">Prazos de disparo de notificações para prestadoras terceirizadas</p>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">Aviso Prévio Inicial (30 dias de antecedência)</h4>
                  <p className="text-slate-500 text-[11px]">Envia e-mail de alerta para o gestor agendar renovação de ASO ou reciclagem de NR.</p>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">ATIVO</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">Alerta de Urgência (15 dias de antecedência)</h4>
                  <p className="text-slate-500 text-[11px]">Disparo conjunto via WhatsApp e E-mail com link direto para upload do certificado.</p>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">ATIVO</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">Bloqueio Automático em D+0 (Dia do Vencimento)</h4>
                  <p className="text-slate-500 text-[11px]">Altera status do trabalhador para BLOQUEADO imediatamente às 00:00 da data limite.</p>
                </div>
                <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">ATIVO</span>
              </div>
            </div>

            {/* PLANNED INTEGRATIONS BADGE */}
            <div className="p-4 rounded-xl border border-dashed border-blue-300 bg-blue-50/40 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-blue-900">Automações e Integrações Avançadas (Roteiro Tecnológico)</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900">Catracas Henry / Dimep</span>
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                      Planejado
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Bloqueio físico instantâneo na catraca via webhook ou API local de obra.</p>
                </div>

                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900">Leitor OCR de ASO</span>
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                      Planejado
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Extração inteligente de CRM, data de emissão e aptidão ocupacional em PDF.</p>
                </div>

                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900">Assinatura ICP-Brasil</span>
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                      Planejado
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Validação criptográfica de certificados de segurança e laudos técnicos.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. DADOS DA ORGANIZACAO & IDENTIDADE VISUAL */}
        {activeTab === 'ORGANIZACAO' && (
          <div className="space-y-6 text-xs">
            {/* Visual Identity Preview Banner */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Palette className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Identidade Visual & Aplicações da Marca DocuCrew</h3>
              </div>
              <p className="text-slate-600 mb-4">
                Padrão oficial de aplicação de logotipo, símbolo modular em circuito com nó amarelo âmbar e variações de fundo claro, escuro e ícones de sistema.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Variant 1: Light Background */}
                <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 mb-3 tracking-wider">Aplicação Fundo Claro</span>
                  <DocuCrewLogo variant="light" size="lg" className="my-2" />
                  <span className="text-[11px] text-slate-500 mt-2">Uso em relatórios, fichas e cabeçalhos claros</span>
                </div>

                {/* Variant 2: Dark Background */}
                <div className="p-5 bg-[#14181F] rounded-xl border border-slate-800 shadow-xs flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 mb-3 tracking-wider">Aplicação Fundo Escuro</span>
                  <DocuCrewLogo variant="dark" size="lg" className="my-2" />
                  <span className="text-[11px] text-slate-400 mt-2">Uso na barra lateral e interfaces noturnas</span>
                </div>

                {/* Variant 3: App Icons & Palette */}
                <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 mb-3 tracking-wider">Ícones de Sistema</span>
                  <div className="flex items-center gap-3 my-2">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                      <DocuCrewIcon variant="light" className="w-6 h-6" />
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#14181F] flex items-center justify-center shadow-xs">
                      <DocuCrewIcon variant="dark" className="w-6 h-6" />
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-xs">
                      <DocuCrewIcon variant="yellow" className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#14181F]"></span> #14181F
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#F59E0B] ml-1"></span> #F59E0B
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-white border border-slate-300 ml-1"></span> #FFFFFF
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-900 pt-2">Dados da Empresa Contratante (Master)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 mb-1 font-bold">Razão Social Contratante</label>
                <input
                  type="text"
                  readOnly
                  value="DocuCrew Gestão de Ativos e Instalações Corporativas S.A."
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-800 font-semibold"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-bold">CNPJ Matriz</label>
                <input
                  type="text"
                  readOnly
                  value="12.345.678/0001-99"
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-800 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-bold">Política de Conformidade Mínima</label>
                <input
                  type="text"
                  readOnly
                  value="100% dos documentos obrigatórios validados previamente ao acesso"
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-bold">Fuso Horário Padrão</label>
                <input
                  type="text"
                  readOnly
                  value="América/São Paulo (BRT - UTC-3)"
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-800 font-mono"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
