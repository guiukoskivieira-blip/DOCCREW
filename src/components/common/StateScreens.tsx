import React, { useState } from 'react';
import {
  ShieldAlert,
  Building2,
  RefreshCw,
  LogOut,
  AlertTriangle,
  Lock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDocuCrew } from '../../context/DocuCrewContext';

/**
 * Screen displayed when an authenticated user has no organization_members association.
 * Serves as the First Access Onboarding flow to create their first company atomically via RPC.
 * Strictly Fail Closed: Zero mocks, zero companies, zero workers shown.
 */
export const OrgNotFoundScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const { reloadSupabaseData, dataLoadingState, createCompanyOnboarding } = useDocuCrew();

  const [companyName, setCompanyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmed = companyName.trim();
    if (!trimmed) {
      setValidationError('Por favor, informe o nome da sua empresa.');
      return;
    }
    if (trimmed.length < 2) {
      setValidationError('O nome da empresa deve ter no mínimo 2 caracteres.');
      return;
    }
    if (trimmed.length > 120) {
      setValidationError('O nome da empresa deve ter no máximo 120 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createCompanyOnboarding(trimmed);
      if (!res.success && res.error) {
        setValidationError(res.error);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao criar o ambiente da empresa.';
      setValidationError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-8 max-w-xl mx-auto">
      {/* Onboarding Card */}
      <div className="w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden p-6 sm:p-8">
        <div className="flex items-center justify-center w-14 h-14 bg-[#061E2E] text-[#FFC400] rounded-2xl mx-auto mb-5 shadow-xs">
          <Building2 className="w-7 h-7" />
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-[#102033] tracking-tight mb-2">
            Configure sua empresa
          </h2>
          <p className="text-sm text-[#587087] leading-relaxed">
            Para começar a usar o DocuCrew, crie o ambiente da sua empresa.
          </p>
        </div>

        {/* User identification badge */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-6 flex items-center justify-between text-xs">
          <span className="text-slate-500">Conta autenticada:</span>
          <span className="font-semibold text-slate-800 font-mono truncate max-w-[240px]">
            {user?.email || 'Usuário'}
          </span>
        </div>

        {/* Validation or backend error alert */}
        {validationError && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 mb-5 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in duration-150">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{validationError}</div>
          </div>
        )}

        {/* Onboarding Form */}
        <form onSubmit={handleCreateCompany} className="space-y-4">
          <div>
            <label htmlFor="company-name-input" className="block text-xs font-bold text-slate-700 mb-1.5 text-left">
              Nome da empresa <span className="text-rose-500">*</span>
            </label>
            <input
              id="company-name-input"
              type="text"
              required
              disabled={isSubmitting}
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Ex: Construtora Horizonte Engenharia"
              maxLength={120}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#061E2E] focus:border-transparent transition-all disabled:opacity-60"
            />
            <p className="text-[11px] text-slate-400 mt-1 text-left">
              Entre 2 e 120 caracteres. O identificador seguro do tenant (slug) será gerado automaticamente.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || dataLoadingState === 'LOADING'}
            className="w-full py-3 px-4 bg-[#061E2E] hover:bg-[#0B2A3F] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                <span>Criando ambiente da empresa...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#FFC400]" />
                <span>Criar minha empresa</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-[11px] text-slate-400 font-medium">
              Já foi convidado por outra empresa?
            </span>
          </div>
        </div>

        {/* Secondary options */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reloadSupabaseData()}
            disabled={dataLoadingState === 'LOADING' || isSubmitting}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${dataLoadingState === 'LOADING' ? 'animate-spin' : ''}`} />
            <span>Verificar Novamente</span>
          </button>

          <button
            type="button"
            onClick={() => signOut()}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Screen displayed when Supabase queries fail (timeout, 500, network error, etc.).
 * Strictly Fail Closed: Never hides error behind demo fallback.
 */
export const SupabaseErrorScreen: React.FC = () => {
  const { dataError, reloadSupabaseData, dataLoadingState } = useDocuCrew();
  const { signOut } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-4 text-center">
      <div className="w-16 h-16 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center text-rose-600 mb-5 shadow-xs">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-[#102033] tracking-tight mb-2">
        Falha de Comunicação com o Supabase
      </h2>

      <p className="text-sm text-[#587087] max-w-lg mb-4 leading-relaxed">
        Não foi possível carregar os registros operacionais remotos da sua organização. O sistema opera em modo de segurança estrito e não carrega dados fictícios.
      </p>

      {dataError && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 max-w-lg text-left text-xs font-mono text-rose-700 mb-6 overflow-x-auto">
          {dataError}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reloadSupabaseData()}
          disabled={dataLoadingState === 'LOADING'}
          className="px-4 py-2.5 rounded-xl bg-[#061E2E] text-white hover:bg-[#0B2A3F] font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${dataLoadingState === 'LOADING' ? 'animate-spin' : ''}`} />
          <span>Tentar Novamente</span>
        </button>

        <button
          onClick={() => signOut()}
          className="px-4 py-2.5 rounded-xl border border-[#DCE4EC] text-[#587087] hover:bg-slate-100 font-bold text-xs flex items-center gap-2 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Desconectar</span>
        </button>
      </div>
    </div>
  );
};

/**
 * Screen displayed when Supabase credentials are not configured and demo is disabled.
 */
export const ConfigErrorScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded-2xl flex items-center justify-center text-slate-700 mb-5 shadow-xs">
        <Lock className="w-8 h-8" />
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-[#102033] tracking-tight mb-2">
        Erro de Configuração do Sistema (Supabase Indisponível)
      </h2>

      <p className="text-sm text-[#587087] max-w-md mb-6 leading-relaxed">
        As variáveis de ambiente <code className="bg-slate-200 px-1 py-0.5 rounded text-xs text-[#102033]">VITE_SUPABASE_URL</code> ou{' '}
        <code className="bg-slate-200 px-1 py-0.5 rounded text-xs text-[#102033]">VITE_SUPABASE_ANON_KEY</code> não foram configuradas e o modo de demonstração está desabilitado (Fail Closed).
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-md text-left text-xs text-amber-800 space-y-1">
        <p className="font-bold">Como resolver:</p>
        <p>1. Configure as chaves do projeto Supabase nas variáveis de ambiente da aplicação.</p>
        <p>2. Caso deseje executar em ambiente de teste simulado, defina explicitamente <code className="font-mono">VITE_ENABLE_DEMO_MODE=true</code>.</p>
      </div>
    </div>
  );
};

/**
 * Screen displayed when the application is in Supabase mode but no active session exists.
 */
export const UnauthenticatedScreen: React.FC = () => {
  const { openAuthModal } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-4 text-center">
      <div className="w-16 h-16 bg-[#061E2E] text-[#FFC400] rounded-2xl flex items-center justify-center mb-5 shadow-md">
        <Lock className="w-8 h-8" />
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-[#102033] tracking-tight mb-2">
        Acesso Restrito ao DocuCrew
      </h2>

      <p className="text-sm text-[#587087] max-w-md mb-6 leading-relaxed">
        Para acessar os dados e prontuários da sua organização ou configurar uma nova empresa, acesse ou crie sua conta.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={openAuthModal}
          className="px-6 py-3 rounded-xl bg-[#061E2E] text-[#FFC400] hover:bg-[#0B2A3F] font-black text-sm flex items-center gap-2.5 transition-all shadow-md hover:shadow-lg"
        >
          <Lock className="w-4 h-4" />
          <span>Fazer Login / Criar Conta</span>
        </button>
      </div>
    </div>
  );
};
