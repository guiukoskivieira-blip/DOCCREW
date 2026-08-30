import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useDocuCrew } from '../../context/DocuCrewContext';
import { Building2, Mail, Phone, User, ShieldCheck } from 'lucide-react';

interface CreateContractorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateContractorModal: React.FC<CreateContractorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addContractor } = useDocuCrew();

  const [name, setName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [responsibleName, setResponsibleName] = useState('');
  const [responsibleEmail, setResponsibleEmail] = useState('');
  const [responsiblePhone, setResponsiblePhone] = useState('');
  const [status, setStatus] = useState<'CONFORME' | 'PARCIAL' | 'BLOQUEADA'>('PARCIAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatCnpj = (value: string) => {
    const raw = value.replace(/\D/g, '').slice(0, 14);
    if (raw.length <= 2) return raw;
    if (raw.length <= 5) return `${raw.slice(0, 2)}.${raw.slice(2)}`;
    if (raw.length <= 8) return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5)}`;
    if (raw.length <= 12) return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8)}`;
    return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8, 12)}-${raw.slice(12, 14)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !tradeName.trim()) {
      setErrorMsg('Razão social e nome fantasia são obrigatórios.');
      return;
    }

    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14 && cleanCnpj.length !== 0) {
      setErrorMsg('CNPJ deve conter 14 dígitos válidos.');
      return;
    }

    setIsSubmitting(true);
    const result = await addContractor({
      name: name.trim(),
      tradeName: tradeName.trim(),
      cnpj: cleanCnpj,
      responsibleName: responsibleName.trim(),
      responsibleEmail: responsibleEmail.trim(),
      responsiblePhone: responsiblePhone.trim(),
      status,
    });
    setIsSubmitting(false);

    if (result.success) {
      // Reset form
      setName('');
      setTradeName('');
      setCnpj('');
      setResponsibleName('');
      setResponsibleEmail('');
      setResponsiblePhone('');
      setStatus('PARCIAL');
      onClose();
    } else {
      setErrorMsg(result.error || 'Erro ao cadastrar terceirizada.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Empresa Terceirizada"
      subtitle="Cadastre uma empresa prestadora de serviços para controle de conformidade"
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
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#061E2E] hover:bg-[#092B42] text-white transition-colors flex items-center gap-1.5 shadow-xs"
          >
            {isSubmitting ? 'Salvando...' : 'Cadastrar Terceirizada'}
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
              Razão Social <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Construtora e Montagens Alpha Ltda"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Nome Fantasia <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Alpha Montagens"
              value={tradeName}
              onChange={(e) => setTradeName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">CNPJ</label>
            <input
              type="text"
              placeholder="00.000.000/0000-00"
              value={cnpj}
              onChange={(e) => setCnpj(formatCnpj(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <h4 className="font-bold text-slate-900 text-xs mb-2.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-600" />
            Responsável Operacional / RH
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Nome do Contato</label>
              <input
                type="text"
                placeholder="Ex: Carlos Eduardo"
                value={responsibleName}
                onChange={(e) => setResponsibleName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">E-mail Corporativo</label>
              <input
                type="email"
                placeholder="rh@alphamontagens.com.br"
                value={responsibleEmail}
                onChange={(e) => setResponsibleEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Telefone / WhatsApp</label>
              <input
                type="tel"
                placeholder="(11) 98765-4321"
                value={responsiblePhone}
                onChange={(e) => setResponsiblePhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <label className="block font-bold text-slate-800 mb-1">Situação Inicial de Conformidade</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            <option value="PARCIAL">PARCIAL (Em processo de homologação / documentação)</option>
            <option value="CONFORME">CONFORME (Regularizada)</option>
            <option value="BLOQUEADA">BLOQUEADA (Com restrição impeditiva)</option>
          </select>
        </div>
      </form>
    </Modal>
  );
};
