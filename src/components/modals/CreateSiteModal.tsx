import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useDocuCrew } from '../../context/DocuCrewContext';
import { Briefcase, MapPin, Calendar, Building } from 'lucide-react';

interface CreateSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateSiteModal: React.FC<CreateSiteModalProps> = ({ isOpen, onClose }) => {
  const { addSite } = useDocuCrew();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!code.trim() || !name.trim() || !clientName.trim()) {
      setErrorMsg('Código, nome da obra e cliente são obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    const result = await addSite({
      code: code.trim(),
      name: name.trim(),
      clientName: clientName.trim(),
      location: location.trim() || 'Não informada',
      startDate,
      endDate: endDate || 'Contínuo',
      status: 'ativo',
    });
    setIsSubmitting(false);

    if (result.success) {
      setCode('');
      setName('');
      setClientName('');
      setLocation('');
      setEndDate('');
      onClose();
    } else {
      setErrorMsg(result.error || 'Erro ao cadastrar obra.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Obra, Contrato ou Frente de Serviço"
      subtitle="Cadastre um novo local ou contrato para controle de terceirizados e normas específicas"
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
            {isSubmitting ? 'Salvando...' : 'Cadastrar Obra'}
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Código / Sigla <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: OBR-005"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold uppercase focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-800 mb-1">
              Nome da Obra / Contrato <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Expansão Planta Química Setor B"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block font-bold text-slate-800 mb-1">
              Cliente / Contratante Principal <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Petroquímica União do Brasil S.A."
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block font-bold text-slate-800 mb-1">
              Localização / Cidade / Endereço
            </label>
            <input
              type="text"
              placeholder="Ex: Polo Industrial de Paulínia - SP"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Data de Início</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-medium text-slate-700 mb-1">
              Previsão de Término (ou Deixe em Branco para Contínuo)
            </label>
            <input
              type="text"
              placeholder="Ex: 31/12/2027 ou Contínuo"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
