import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  FileUp,
  UserPlus,
  Building2,
  Briefcase,
  FileCode2,
  ChevronDown,
} from 'lucide-react';

interface QuickActionsMenuProps {
  onOpenUploadDoc: () => void;
  onOpenNewWorker: () => void;
  onOpenNewContractor: () => void;
  onOpenNewSite: () => void;
  onOpenNewDocType: () => void;
}

export const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({
  onOpenUploadDoc,
  onOpenNewWorker,
  onOpenNewContractor,
  onOpenNewSite,
  onOpenNewDocType,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-sm transition-all transform active:scale-95"
      >
        <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
        <span>Novo Cadastro</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-900 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Ações Rápidas de Cadastro
          </div>

          <div className="p-1 space-y-0.5 text-xs">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenUploadDoc();
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2.5 text-slate-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FileUp className="w-4 h-4" />
              </div>
              <div>
                <strong className="block font-semibold text-slate-900 leading-tight">Enviar Documento</strong>
                <span className="text-[10px] text-slate-500">Upload de ASO, NRs e certificados</span>
              </div>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenNewWorker();
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2.5 text-slate-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <strong className="block font-semibold text-slate-900 leading-tight">Novo Trabalhador</strong>
                <span className="text-[10px] text-slate-500">Cadastro individual de terceiro</span>
              </div>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenNewContractor();
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2.5 text-slate-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <strong className="block font-semibold text-slate-900 leading-tight">Nova Terceirizada</strong>
                <span className="text-[10px] text-slate-500">Empresa prestadora de serviços</span>
              </div>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenNewSite();
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2.5 text-slate-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <strong className="block font-semibold text-slate-900 leading-tight">Nova Obra / Contrato</strong>
                <span className="text-[10px] text-slate-500">Local de alocação ou cliente</span>
              </div>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenNewDocType();
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2.5 text-slate-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <FileCode2 className="w-4 h-4" />
              </div>
              <div>
                <strong className="block font-semibold text-slate-900 leading-tight">Tipo de Documento</strong>
                <span className="text-[10px] text-slate-500">Requisito de norma ou validade</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
