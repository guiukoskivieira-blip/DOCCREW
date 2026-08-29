import React, { useState } from 'react';
import { useDocuCrew } from '../context/DocuCrewContext';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import {
  Bell,
  AlertTriangle,
  Clock,
  FileQuestion,
  Send,
  CheckCheck,
  CheckCircle2,
  Mail,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  Filter,
} from 'lucide-react';

export const AlertasPage: React.FC = () => {
  const {
    alerts,
    notificationLogs,
    markAlertAsRead,
    markAllAlertsAsRead,
    sendContractorNotification,
    contractors,
  } = useDocuCrew();

  const [activeTab, setActiveTab] = useState<'VENCIDOS' | 'PROXIMOS' | 'FALTANTES' | 'HISTORICO'>('VENCIDOS');
  const [selectedContractorForCobrança, setSelectedContractorForCobrança] = useState<string>('');
  const [showCobrarModal, setShowCobrarModal] = useState(false);
  const [cobrancaChannel, setCobrancaChannel] = useState<'EMAIL' | 'WHATSAPP' | 'PORTAL'>('WHATSAPP');

  // Filter alerts by tab
  const vencidosAlerts = alerts.filter((a) => a.type === 'VENCIDO');
  const proximosAlerts = alerts.filter((a) => a.type === 'PROXIMO_VENCIMENTO');
  const faltantesAlerts = alerts.filter((a) => a.type === 'DOCUMENTO_FALTANTE');

  const handleSendCobranca = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedContractorForCobrança) {
      sendContractorNotification(
        selectedContractorForCobrança,
        cobrancaChannel,
        'Cobrança urgente de regularização documental'
      );
      setShowCobrarModal(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Central de Alertas, Vencimentos & Notificações
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoramento de prazos normativos de NRs, ASOs e disparo de avisos preventivos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={markAllAlertsAsRead}
            className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-slate-500" />
            Marcar Todos como Lidos
          </button>
          <button
            onClick={() => {
              setSelectedContractorForCobrança(contractors[0]?.id || '');
              setShowCobrarModal(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            Nova Cobrança
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('VENCIDOS')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'VENCIDOS'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          Vencidos (Críticos)
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-800">
            {vencidosAlerts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('PROXIMOS')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'PROXIMOS'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-600" />
          Próximos do Vencimento
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800">
            {proximosAlerts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('FALTANTES')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'FALTANTES'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileQuestion className="w-4 h-4 text-blue-600" />
          Documentos Faltantes
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800">
            {faltantesAlerts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('HISTORICO')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'HISTORICO'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className="w-4 h-4 text-slate-600" />
          Histórico de Notificações
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-800">
            {notificationLogs.length}
          </span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* TAB: VENCIDOS */}
        {activeTab === 'VENCIDOS' && (
          <div className="divide-y divide-slate-100">
            {vencidosAlerts.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Nenhum documento vencido no momento!"
                description="Todos os trabalhadores estão com certificados e atestados dentro do prazo de validade legal."
              />
            ) : (
              vencidosAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 sm:p-5 hover:bg-rose-50/20 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    !alert.isRead ? 'bg-rose-50/10' : ''
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge status="CRITICA" variant="alert" />
                      <h4 className="font-bold text-slate-900 text-sm">{alert.title}</h4>
                      <span className="text-[10px] text-slate-400 font-mono ml-auto md:ml-0">
                        {alert.createdAt}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">{alert.description}</p>

                    <div className="flex flex-wrap items-center gap-x-4 text-xs text-slate-500 pt-1">
                      <span>
                        Trabalhador: <strong>{alert.workerName}</strong>
                      </span>
                      <span>
                        Terceirizada: <strong>{alert.contractorName}</strong>
                      </span>
                      <span>
                        Obra: <strong>{alert.siteName}</strong>
                      </span>
                    </div>

                    <div className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200 mt-2">
                      <strong>Ação Necessária:</strong> {alert.actionRequired}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 self-end md:self-center">
                    {!alert.isRead && (
                      <button
                        onClick={() => markAlertAsRead(alert.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        Marcar como lido
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const contractor = contractors.find((c) => c.tradeName === alert.contractorName);
                        if (contractor) setSelectedContractorForCobrança(contractor.id);
                        setShowCobrarModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Cobrar Prestadora
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: PROXIMOS DO VENCIMENTO */}
        {activeTab === 'PROXIMOS' && (
          <div className="divide-y divide-slate-100">
            {proximosAlerts.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Nenhum documento prestes a expirar"
                description="Não há vencimentos previstos para os próximos 30 dias."
              />
            ) : (
              proximosAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 sm:p-5 hover:bg-amber-50/20 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge status="ATENCAO" variant="alert" />
                      <h4 className="font-bold text-slate-900 text-sm">{alert.title}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">{alert.createdAt}</span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">{alert.description}</p>

                    <div className="flex flex-wrap items-center gap-x-4 text-xs text-slate-500 pt-1">
                      <span>
                        Trabalhador: <strong>{alert.workerName}</strong>
                      </span>
                      <span>
                        Terceirizada: <strong>{alert.contractorName}</strong>
                      </span>
                      <span>
                        Prazo Restante:{' '}
                        <strong className="text-amber-700">{alert.daysRemaining} dias</strong>
                      </span>
                    </div>

                    <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-1.5">
                      <strong>Ação recomendada:</strong> {alert.actionRequired}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => {
                        const contractor = contractors.find((c) => c.tradeName === alert.contractorName);
                        if (contractor) setSelectedContractorForCobrança(contractor.id);
                        setShowCobrarModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Avisar Prestadora
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: DOCUMENTOS FALTANTES */}
        {activeTab === 'FALTANTES' && (
          <div className="divide-y divide-slate-100">
            {faltantesAlerts.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Sem pendências de envio"
                description="Todos os trabalhadores possuem a documentação de admissão/alocação completa."
              />
            ) : (
              faltantesAlerts.map((alert) => (
                <div key={alert.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge status="CRITICA" variant="alert" />
                      <h4 className="font-bold text-slate-900 text-sm">{alert.title}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">{alert.createdAt}</span>
                    </div>
                    <p className="text-xs text-slate-700">{alert.description}</p>
                    <div className="text-[11px] text-slate-500">
                      Terceirizada: <strong>{alert.contractorName}</strong>
                    </div>
                  </div>

                  <div className="shrink-0 self-end md:self-center">
                    <button
                      onClick={() => {
                        const contractor = contractors.find((c) => c.tradeName === alert.contractorName);
                        if (contractor) setSelectedContractorForCobrança(contractor.id);
                        setShowCobrarModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Cobrar Envio
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: HISTORICO */}
        {activeTab === 'HISTORICO' && (
          <div className="divide-y divide-slate-100">
            {notificationLogs.map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50 text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    {log.channel === 'EMAIL' ? (
                      <Mail className="w-4 h-4" />
                    ) : log.channel === 'WHATSAPP' ? (
                      <MessageSquare className="w-4 h-4" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900">{log.subject}</h5>
                    <p className="text-slate-500 text-[11px]">
                      Destinatário: {log.recipient} ({log.contractorName}) • Canal: {log.channel}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {log.status}
                  </span>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{log.sentAt}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Notification Modal */}
      {showCobrarModal && (
        <Modal
          isOpen={showCobrarModal}
          onClose={() => setShowCobrarModal(false)}
          title="Emitir Cobrança Documental"
          subtitle="Envio de notificação de pendências para o responsável da terceirizada"
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setShowCobrarModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendCobranca}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                Disparar Notificação
              </button>
            </div>
          }
        >
          <form onSubmit={handleSendCobranca} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Empresa Destinatária</label>
              <select
                value={selectedContractorForCobrança}
                onChange={(e) => setSelectedContractorForCobrança(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                {contractors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.tradeName} ({c.responsibleName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Canal de Disparo</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCobrancaChannel('WHATSAPP')}
                  className={`p-2 rounded-lg border text-center font-semibold transition-all ${
                    cobrancaChannel === 'WHATSAPP'
                      ? 'bg-blue-50 border-blue-600 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setCobrancaChannel('EMAIL')}
                  className={`p-2 rounded-lg border text-center font-semibold transition-all ${
                    cobrancaChannel === 'EMAIL'
                      ? 'bg-blue-50 border-blue-600 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  E-mail
                </button>
                <button
                  type="button"
                  onClick={() => setCobrancaChannel('PORTAL')}
                  className={`p-2 rounded-lg border text-center font-semibold transition-all ${
                    cobrancaChannel === 'PORTAL'
                      ? 'bg-blue-50 border-blue-600 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  Portal
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
