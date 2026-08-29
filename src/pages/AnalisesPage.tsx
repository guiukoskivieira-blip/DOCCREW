import React, { useState } from 'react';
import { useDocuCrew } from '../context/DocuCrewContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { WorkerDocument } from '../types';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  FileText,
  Clock,
  ShieldCheck,
  Send,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const AnalisesPage: React.FC = () => {
  const {
    documents,
    approveDocument,
    rejectDocument,
    requestCorrection,
  } = useDocuCrew();

  // Selected document for action
  const [viewingDoc, setViewingDoc] = useState<WorkerDocument | null>(null);
  const [rejectingDoc, setRejectingDoc] = useState<WorkerDocument | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [correctingDoc, setCorrectingDoc] = useState<WorkerDocument | null>(null);
  const [correctionNotes, setCorrectionNotes] = useState('');

  // Queue of documents awaiting review
  const pendingQueue = documents.filter((d) => d.status === 'AGUARDANDO_ANALISE');
  const recentlyReviewed = documents.filter(
    (d) => d.status === 'APROVADO' || d.status === 'RECUSADO'
  ).slice(0, 5);

  const handleApprove = (doc: WorkerDocument) => {
    approveDocument(doc.id, 'Fiscal Roberto Farias (TST)');
    if (viewingDoc?.id === doc.id) setViewingDoc(null);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (rejectingDoc && rejectionReason.trim()) {
      rejectDocument(rejectingDoc.id, rejectionReason.trim(), 'Fiscal Roberto Farias (TST)');
      setRejectingDoc(null);
      setRejectionReason('');
      if (viewingDoc?.id === rejectingDoc.id) setViewingDoc(null);
    }
  };

  const handleConfirmCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (correctingDoc && correctionNotes.trim()) {
      requestCorrection(correctingDoc.id, correctionNotes.trim(), 'Fiscal Roberto Farias (TST)');
      setCorrectingDoc(null);
      setCorrectionNotes('');
      if (viewingDoc?.id === correctingDoc.id) setViewingDoc(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-blue-600" />
            Fila de Análise & Homologação Documental
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Validação técnica por Técnicos e Engenheiros de Segurança do Trabalho com auditoria de conformidade
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            {pendingQueue.length} documentos na fila
          </span>
        </div>
      </div>

      {/* Main Review Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>Fila Ativa de Homologação</span>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-mono font-bold">
              {pendingQueue.length}
            </span>
          </h3>
          <span className="text-xs text-slate-500">
            Ações em tempo real com liberação instantânea de acesso
          </span>
        </div>

        {pendingQueue.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Fila de análise zerada!"
            description="Parabéns! Todos os documentos submetidos pelas empresas terceirizadas já foram homologados."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingQueue.map((doc) => (
              <div
                key={doc.id}
                className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {doc.documentTypeName}
                    </span>
                    <Badge status="AGUARDANDO_ANALISE" variant="document" />
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
                      {doc.fileName || 'documento.pdf'} ({doc.fileSize || '450 KB'})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 pt-1">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Titular:</span>
                      <strong className="text-slate-900">{doc.workerName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Terceirizada:</span>
                      <strong className="text-slate-800">{doc.contractorName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Obra Alocada:</span>
                      <span className="text-slate-700">{doc.siteName}</span>
                    </div>
                  </div>

                  {doc.issuerDetails && (
                    <p className="text-[11px] text-slate-500">
                      Emitente: <strong>{doc.issuerDetails.professionalName}</strong> (
                      {doc.issuerDetails.registryNumber}) • Carga Horária:{' '}
                      {doc.issuerDetails.trainingHours ? `${doc.issuerDetails.trainingHours}h` : 'N/A'}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => setViewingDoc(doc)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Visualizar
                  </button>

                  <button
                    onClick={() => {
                      setCorrectingDoc(doc);
                      setCorrectionNotes('');
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors"
                  >
                    Solicitar Correção
                  </button>

                  <button
                    onClick={() => {
                      setRejectingDoc(doc);
                      setRejectionReason('');
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Recusar
                  </button>

                  <button
                    onClick={() => handleApprove(doc)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Aprovar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History of Recently Reviewed Docs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Histórico de Análises Recentes Homologadas
        </h3>
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
          {recentlyReviewed.map((doc) => (
            <div key={doc.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">
                    {doc.documentTypeName} • <span className="font-normal text-slate-600">{doc.workerName}</span>
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {doc.contractorName} • Validado por {doc.reviewedBy || 'Fiscal TST'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge status={doc.status} variant="document" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Viewing / Detailed Analysis Modal */}
      {viewingDoc && (
        <Modal
          isOpen={!!viewingDoc}
          onClose={() => setViewingDoc(null)}
          title={`Homologação Técnica: ${viewingDoc.documentTypeName}`}
          subtitle={`Titular: ${viewingDoc.workerName} • ${viewingDoc.contractorName}`}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setRejectingDoc(viewingDoc);
                    setRejectionReason('');
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                >
                  Recusar...
                </button>
                <button
                  onClick={() => {
                    setCorrectingDoc(viewingDoc);
                    setCorrectionNotes('');
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200"
                >
                  Solicitar Correção
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewingDoc(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800"
                >
                  Fechar
                </button>
                <button
                  onClick={() => handleApprove(viewingDoc)}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Aprovar Documento
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Technical Verification checklist */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900">Critérios de Validação da Norma Regulamentadora:</h4>
              <div className="space-y-1 text-slate-700">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Assinatura do Responsável Técnico / Médico do Trabalho identificada
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Data de emissão dentro da vigência permitida ({viewingDoc.issueDate})
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Aptidão médica explícita para as atividades da função na obra {viewingDoc.siteName}
                </p>
              </div>
            </div>

            {/* Document Preview Box */}
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-700 pb-2">
                <span>Arquivo Digital: {viewingDoc.fileName || 'laudo_tecnico.pdf'}</span>
                <span>Hash de Auditoria: SHA256-OK</span>
              </div>
              <p className="font-mono text-xs text-slate-300">
                [VISUALIZAÇÃO DE CERTIFICADO / ATESTADO]
                <br />
                Certifico que {viewingDoc.workerName} cumpriu integralmente o programa de treinamento
                conforme exigido pela legislação vigente.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal with Mandatory Reason */}
      {rejectingDoc && (
        <Modal
          isOpen={!!rejectingDoc}
          onClose={() => setRejectingDoc(null)}
          title="Recusar Documento (Exigência de Motivo)"
          subtitle={`Documento: ${rejectingDoc.documentTypeName} • ${rejectingDoc.workerName}`}
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setRejectingDoc(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={!rejectionReason.trim()}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white flex items-center gap-1.5 shadow-xs"
              >
                <XCircle className="w-3.5 h-3.5" />
                Confirmar Recusa e Bloqueio
              </button>
            </div>
          }
        >
          <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Atenção: A recusa manterá o trabalhador bloqueado
              </p>
              <p className="text-[11px] text-rose-700 mt-1">
                O motivo informado abaixo será registrado no prontuário e enviado à prestadora terceirizada para correção.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Motivo da Recusa (Obrigatório) *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Carga horária insuficiente na NR-35; Assinatura do médico ilegível; Falta de aptidão para altura..."
                rows={4}
                required
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-rose-600 focus:outline-none"
              />
            </div>

            {/* Quick Reason Suggestions */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                Motivos Frequentes:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Carga horária em desacordo com a NR',
                  'Assinatura do responsável técnico ausente',
                  'Falta de carimbo/registro no conselho de classe',
                  'Documento cortado ou com partes ilegíveis',
                  'Validade expirada na data de emissão',
                ].map((reason, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectionReason(reason)}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-medium border border-slate-200 transition-colors"
                  >
                    + {reason}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Request Correction Modal */}
      {correctingDoc && (
        <Modal
          isOpen={!!correctingDoc}
          onClose={() => setCorrectingDoc(null)}
          title="Solicitar Ajuste / Correção de Documento"
          subtitle={`${correctingDoc.documentTypeName} • ${correctingDoc.workerName}`}
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setCorrectingDoc(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCorrection}
                disabled={!correctionNotes.trim()}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                Enviar Solicitação
              </button>
            </div>
          }
        >
          <form onSubmit={handleConfirmCorrection} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Orientações de Correção para a Terceirizada *
              </label>
              <textarea
                value={correctionNotes}
                onChange={(e) => setCorrectionNotes(e.target.value)}
                placeholder="Ex: Favor re-enviar a folha 2 do ASO contendo o carimbo legível do CRM do médico examinador..."
                rows={4}
                required
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-600 focus:outline-none"
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
