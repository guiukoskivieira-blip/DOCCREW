import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useDocuCrew } from '../../context/DocuCrewContext';
import { Users, AlertTriangle, Building2, Briefcase, ShieldAlert } from 'lucide-react';

interface CreateWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultContractorId?: string;
  defaultSiteId?: string;
}

export const CreateWorkerModal: React.FC<CreateWorkerModalProps> = ({
  isOpen,
  onClose,
  defaultContractorId,
  defaultSiteId,
}) => {
  const { contractors, worksites, addWorker } = useDocuCrew();

  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [role, setRole] = useState('');
  const [contractorId, setContractorId] = useState(defaultContractorId || contractors[0]?.id || '');
  const [siteId, setSiteId] = useState(defaultSiteId || '');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatCpf = (value: string) => {
    const raw = value.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 3) return raw;
    if (raw.length <= 6) return `${raw.slice(0, 3)}.${raw.slice(3)}`;
    if (raw.length <= 9) return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
    return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9, 11)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !role.trim() || !contractorId) {
      setErrorMsg('Nome, função e empresa terceirizada são obrigatórios.');
      return;
    }

    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11 && cleanCpf.length !== 0) {
      setErrorMsg('CPF deve conter 11 dígitos.');
      return;
    }

    setIsSubmitting(true);
    const result = await addWorker({
      name: name.trim(),
      cpf: cleanCpf,
      role: role.trim(),
      contractorId,
      siteId: siteId || undefined,
      admissionDate,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
    });
    setIsSubmitting(false);

    if (result.success) {
      setName('');
      setCpf('');
      setRole('');
      setEmail('');
      setPhone('');
      onClose();
    } else {
      setErrorMsg(result.error || 'Erro ao cadastrar trabalhador.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo Trabalhador Terceirizado"
      subtitle="Cadastre o colaborador para emissão de prontuário e controle de NRs/ASO"
      maxWidth="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Iniciará com status <strong>BLOQUEADO</strong> até homologação</span>
          </div>
          <div className="flex items-center gap-2">
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
              {isSubmitting ? 'Salvando...' : 'Cadastrar Trabalhador'}
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
            {errorMsg}
          </div>
        )}

        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Regra de Segurança e Homologação:</strong>
            <p className="mt-0.5 text-amber-800 text-[11px] leading-relaxed">
              Conforme as diretrizes de SST, o trabalhador é registrado inicialmente como <strong>BLOQUEADO</strong>.
              A liberação automática para acesso aos canteiros ocorre assim que todos os documentos obrigatórios forem aprovados.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-800 mb-1">
              Nome Completo do Trabalhador <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: João da Silva Santos"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              CPF <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(formatCpf(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Função / Cargo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Eletricista de Alta Tensão (NR-10)"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Empresa Terceirizada <span className="text-rose-500">*</span>
            </label>
            <select
              value={contractorId}
              onChange={(e) => setContractorId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="">Selecione a empresa prestadora...</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.tradeName} ({c.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Obra / Frente de Alocação Inicial
            </label>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="">Selecione a obra de alocação (opcional)...</option>
              {worksites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name} ({s.clientName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Data de Admissão</label>
            <input
              type="date"
              value={admissionDate}
              onChange={(e) => setAdmissionDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Telefone de Contato</label>
            <input
              type="tel"
              placeholder="(11) 99999-8888"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
