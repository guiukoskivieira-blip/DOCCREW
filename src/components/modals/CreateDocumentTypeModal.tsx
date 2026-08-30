import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useDocuCrew } from '../../context/DocuCrewContext';
import { DocumentTypeDefinition } from '../../types';
import { FileText, Shield, Clock, AlertTriangle } from 'lucide-react';

interface CreateDocumentTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: DocumentTypeDefinition | null;
}

export const CreateDocumentTypeModal: React.FC<CreateDocumentTypeModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const { addDocumentType, editDocumentType, worksites, contractors } = useDocuCrew();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<'SEGURANCA' | 'SAUDE' | 'CLT' | 'QUALIFICACAO' | 'CORPORATIVO'>('SEGURANCA');
  const [description, setDescription] = useState('');
  const [hasExpiration, setHasExpiration] = useState(true);
  const [validityMonths, setValidityMonths] = useState(12);
  const [earlyAlertDays, setEarlyAlertDays] = useState(30);
  const [isMandatory, setIsMandatory] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [requirementScope, setRequirementScope] = useState<'ORGANIZATION' | 'ROLE' | 'CONTRACTOR' | 'SITE'>('ORGANIZATION');
  const [roleName, setRoleName] = useState('');
  const [contractorId, setContractorId] = useState('');
  const [siteId, setSiteId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCategory(initialData.category);
      setDescription(initialData.description || '');
      setHasExpiration(initialData.validityDays !== null);
      setValidityMonths(initialData.validityDays ? Math.round(initialData.validityDays / 30) : 12);
      setEarlyAlertDays(initialData.earlyAlertDays || 30);
      setIsMandatory(initialData.isMandatory);
      setIsActive(initialData.isActive);
      setRequirementScope(initialData.scope || 'ORGANIZATION');
      setContractorId(initialData.targetContractorId || '');
      setSiteId(initialData.targetSiteId || '');
      setRoleName(initialData.targetRole || '');
    } else {
      setName('');
      setCategory('SEGURANCA');
      setDescription('');
      setHasExpiration(true);
      setValidityMonths(12);
      setEarlyAlertDays(30);
      setIsMandatory(true);
      setIsActive(true);
      setRequirementScope('ORGANIZATION');
      setContractorId('');
      setSiteId('');
      setRoleName('');
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('O nome do tipo de documento é obrigatório.');
      return;
    }

    setIsSubmitting(true);

    if (initialData) {
      const result = await editDocumentType(initialData.id, {
        name: name.trim(),
        category,
        description: description.trim(),
        hasExpiration,
        validityMonths: hasExpiration ? validityMonths : null,
        earlyAlertDays,
        isMandatory,
        isActive,
        requirementScope,
        roleId: requirementScope === 'ROLE' ? roleName : undefined,
        contractorId: requirementScope === 'CONTRACTOR' ? contractorId : undefined,
        siteId: requirementScope === 'SITE' ? siteId : undefined,
      });
      setIsSubmitting(false);
      if (result.success) {
        onClose();
      } else {
        setErrorMsg(result.error || 'Erro ao atualizar tipo de documento.');
      }
    } else {
      const result = await addDocumentType({
        name: name.trim(),
        category,
        description: description.trim(),
        hasExpiration,
        validityMonths: hasExpiration ? validityMonths : null,
        earlyAlertDays,
        isMandatory,
        isActive,
        requirementScope,
        roleId: requirementScope === 'ROLE' ? roleName : undefined,
        contractorId: requirementScope === 'CONTRACTOR' ? contractorId : undefined,
        siteId: requirementScope === 'SITE' ? siteId : undefined,
      });
      setIsSubmitting(false);
      if (result.success) {
        onClose();
      } else {
        setErrorMsg(result.error || 'Erro ao criar tipo de documento.');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Tipo de Documento' : 'Novo Tipo de Documento'}
      subtitle="Defina requisitos normativos, NRs, prazos de validade e abrangência de homologação"
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
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#061E2E] hover:bg-[#092B42] text-white transition-colors shadow-xs"
          >
            {isSubmitting ? 'Salvando...' : initialData ? 'Salvar Alterações' : 'Criar Tipo de Documento'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-800 mb-1">
              Nome do Documento / Norma Regulamentadora <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Treinamento NR-35 - Trabalho em Altura"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Categoria <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="SEGURANCA">Segurança & NRs Operacionais</option>
              <option value="SAUDE">Saúde Ocupacional (ASO / PCMSO)</option>
              <option value="CLT">Trabalhista & Contratual (CTPS / Ficha)</option>
              <option value="QUALIFICACAO">Qualificação / Certificação Técnica</option>
              <option value="CORPORATIVO">Corporativo & Seguros</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Escopo da Exigência
            </label>
            <select
              value={requirementScope}
              onChange={(e) => setRequirementScope(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="ORGANIZATION">Toda a Organização (Geral)</option>
              <option value="ROLE">Função / Cargo Específico</option>
              <option value="SITE">Obra / Contrato Específico</option>
              <option value="CONTRACTOR">Terceirizada Específica</option>
            </select>
          </div>

          {requirementScope === 'ROLE' && (
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-800 mb-1">Nome da Função Exigida</label>
              <input
                type="text"
                placeholder="Ex: Soldador, Eletricista, Operador de Munck"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          )}

          {requirementScope === 'SITE' && (
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-800 mb-1">Obra / Contrato Específico</label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="">Selecione a obra...</option>
                {worksites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {requirementScope === 'CONTRACTOR' && (
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-800 mb-1">Terceirizada Específica</label>
              <select
                value={contractorId}
                onChange={(e) => setContractorId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="">Selecione a terceirizada...</option>
                {contractors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.tradeName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-800 mb-1">
              Orientações para Análise / Descrição do Documento
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Verificar se a assinatura do instrutor é habilitada e se a carga horária mínima de 8h foi cumprida."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Validity & Alerts */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900">
              <input
                type="checkbox"
                checked={hasExpiration}
                onChange={(e) => setHasExpiration(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              Possui prazo de validade determinado?
            </label>
            <span className="text-[11px] text-slate-500">
              {hasExpiration ? 'Validade Periódica' : 'Validade Indeterminada'}
            </span>
          </div>

          {hasExpiration && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Validade Padrão (Meses)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={validityMonths}
                  onChange={(e) => setValidityMonths(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Alerta Preventivo (Dias antes)</label>
                <input
                  type="number"
                  min="5"
                  max="90"
                  value={earlyAlertDays}
                  onChange={(e) => setEarlyAlertDays(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Rules & Mandatoriness */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isMandatory}
              onChange={(e) => setIsMandatory(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
            />
            <div>
              <span className="font-bold text-slate-900 block">Obrigatório para Liberação</span>
              <span className="text-[11px] text-slate-500">Se ausente ou vencido, bloqueia o trabalhador</span>
            </div>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
            />
            <span className="font-bold text-slate-900">Tipo Ativo</span>
          </label>
        </div>
      </form>
    </Modal>
  );
};
