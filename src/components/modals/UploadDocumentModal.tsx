import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { useDocuCrew } from '../../context/DocuCrewContext';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  Calendar,
  Building2,
  Users,
} from 'lucide-react';
import { validateUploadFile } from '../../services/supabaseMutationService';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultWorkerId?: string;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  defaultWorkerId,
}) => {
  const { workers, contractors, worksites, documentTypes, uploadDocument } = useDocuCrew();

  const [selectedWorkerId, setSelectedWorkerId] = useState(defaultWorkerId || '');
  const [selectedDocTypeId, setSelectedDocTypeId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [hasNoExpiry, setHasNoExpiry] = useState(false);
  const [notes, setNotes] = useState('');

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive worker, contractor, and site
  const currentWorker = workers.find((w) => w.id === selectedWorkerId);
  const currentContractor = currentWorker
    ? contractors.find((c) => c.id === currentWorker.contractorId)
    : null;
  const currentSite = currentWorker?.siteIds[0]
    ? worksites.find((s) => s.id === currentWorker.siteIds[0])
    : null;

  // Derive document type
  const currentDocType = documentTypes.find((dt) => dt.id === selectedDocTypeId);

  useEffect(() => {
    if (defaultWorkerId) {
      setSelectedWorkerId(defaultWorkerId);
    } else if (workers.length > 0 && !selectedWorkerId) {
      setSelectedWorkerId(workers[0].id);
    }
  }, [defaultWorkerId, workers]);

  useEffect(() => {
    if (documentTypes.length > 0 && !selectedDocTypeId) {
      setSelectedDocTypeId(documentTypes[0].id);
    }
  }, [documentTypes]);

  // Suggest expiry date based on issue date and document type validity
  useEffect(() => {
    if (currentDocType && currentDocType.validityDays && issueDate && !hasNoExpiry) {
      const issue = new Date(issueDate);
      if (!isNaN(issue.getTime())) {
        const exp = new Date(issue);
        exp.setDate(exp.getDate() + currentDocType.validityDays);
        setExpiryDate(exp.toISOString().split('T')[0]);
      }
    } else if (currentDocType && currentDocType.validityDays === null) {
      setHasNoExpiry(true);
      setExpiryDate('');
    }
  }, [currentDocType, issueDate, hasNoExpiry]);

  const handleFileChange = (selected: File | null) => {
    setErrorMsg(null);
    if (!selected) return;

    const validation = validateUploadFile(selected);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Arquivo inválido.');
      setFile(null);
      return;
    }

    setFile(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedWorkerId) {
      setErrorMsg('Selecione um trabalhador.');
      return;
    }

    if (!selectedDocTypeId) {
      setErrorMsg('Selecione o tipo de documento.');
      return;
    }

    if (!file) {
      setErrorMsg('Selecione um arquivo PDF ou imagem para envio.');
      return;
    }

    if (!currentWorker) {
      setErrorMsg('Trabalhador não encontrado no sistema.');
      return;
    }

    setIsSubmitting(true);
    const result = await uploadDocument(file, {
      workerId: currentWorker.id,
      contractorId: currentWorker.contractorId,
      siteId: currentWorker.siteIds[0] || undefined,
      documentTypeId: selectedDocTypeId,
      issueDate,
      expiryDate: hasNoExpiry ? null : expiryDate || null,
      notes: notes.trim() || undefined,
    });
    setIsSubmitting(false);

    if (result.success) {
      // Reset form
      setFile(null);
      setNotes('');
      onClose();
    } else {
      setErrorMsg(result.error || 'Falha ao enviar documento.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enviar Documento para Homologação"
      subtitle="Upload de ASO, Certificados de NRs, Ficha de EPI e comprovações de conformidade"
      maxWidth="xl"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !file}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#061E2E] hover:bg-[#092B42] text-white transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            {isSubmitting ? 'Enviando documento...' : 'Enviar Documento'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong>Atenção:</strong>
              <p className="mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Worker Selector */}
          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-800 mb-1">
              Trabalhador Titular <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="">Selecione o colaborador...</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} — {w.role} ({w.contractorName})
                </option>
              ))}
            </select>
          </div>

          {/* Auto-filled details */}
          {currentWorker && (
            <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 font-medium block">Empresa Terceirizada:</span>
                <span className="font-bold text-slate-900">
                  {currentContractor?.tradeName || currentWorker.contractorName}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Obra / Contrato Vinculado:</span>
                <span className="font-bold text-slate-900">
                  {currentSite ? `${currentSite.code} - ${currentSite.name}` : 'Canteiro Geral'}
                </span>
              </div>
            </div>
          )}

          {/* Document Type Selector */}
          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-800 mb-1">
              Tipo de Documento Normativo <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedDocTypeId}
              onChange={(e) => setSelectedDocTypeId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="">Selecione o tipo de documento...</option>
              {documentTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>
                  {dt.name} ({dt.category})
                </option>
              ))}
            </select>
          </div>

          {/* Issue Date */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Data de Emissão <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* Expiry Date */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-800">Data de Vencimento</label>
              <label className="flex items-center gap-1 cursor-pointer text-[10px] text-slate-500">
                <input
                  type="checkbox"
                  checked={hasNoExpiry}
                  onChange={(e) => {
                    setHasNoExpiry(e.target.checked);
                    if (e.target.checked) setExpiryDate('');
                  }}
                  className="rounded text-blue-600 w-3 h-3"
                />
                Sem vencimento
              </label>
            </div>
            <input
              type="date"
              disabled={hasNoExpiry}
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
            />
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-800 mb-1">
              Observações / Informações de Emissão (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Emitido pelo Dr. Rodrigo Silva - CRM 123456 / Carga 16h"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>
        </div>

        {/* File Drag & Drop Box */}
        <div>
          <label className="block font-bold text-slate-800 mb-1.5">
            Arquivo do Documento <span className="text-rose-500">*</span>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/jpeg,image/png"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />

          {!file ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/60'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-800">
                  Arraste e solte o arquivo aqui ou <span className="text-blue-600 underline">clique para selecionar</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Formatos aceitos: PDF, JPG, JPEG ou PNG • Limite máximo: 10 MB
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 text-xs truncate max-w-xs">{file.name}</h5>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {(file.size / 1024).toFixed(0)} KB • Arquivo validado
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 py-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900"
                >
                  Substituir
                </button>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};
