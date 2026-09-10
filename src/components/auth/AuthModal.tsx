import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DocuCrewLogo } from '../common/DocuCrewLogo';
import { INITIAL_SYSTEM_USERS } from '../../data/mockData';
import { SystemUser } from '../../types';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    signIn,
    signUp,
    resetPassword,
    resendConfirmationEmail,
    isConfigured,
    isDemoAllowed,
    supabaseUrl,
    currentUser,
    setDemoUser,
    error,
    clearError,
  } = useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'RECOVERY' | 'CONFIRM_EMAIL'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<SystemUser['role']>('FISCAL_SEGURANCA');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  if (!isAuthModalOpen) return null;

  const handleModeChange = (newMode: 'LOGIN' | 'REGISTER' | 'RECOVERY') => {
    setMode(newMode);
    setFeedbackMessage(null);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMessage(null);
    clearError();

    // Frontend validations
    if (mode === 'REGISTER') {
      if (password.length < 8) {
        setFeedbackMessage({
          type: 'error',
          text: 'A senha deve conter no mínimo 8 caracteres.',
        });
        return;
      }
      if (password !== confirmPassword) {
        setFeedbackMessage({
          type: 'error',
          text: 'As senhas informadas não coincidem. Digite novamente.',
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === 'LOGIN') {
        const res = await signIn(email, password);
        if (res.success) {
          setFeedbackMessage({ type: 'success', text: 'Autenticação realizada com sucesso!' });
        } else if (res.error) {
          setFeedbackMessage({ type: 'error', text: res.error });
        }
      } else if (mode === 'REGISTER') {
        const res = await signUp(email, password, fullName, role);
        if (res.success) {
          if (res.requireVerification) {
            setMode('CONFIRM_EMAIL');
            setFeedbackMessage(null);
          } else {
            setFeedbackMessage({ type: 'success', text: 'Conta criada e autenticada com sucesso!' });
          }
        } else if (res.error) {
          setFeedbackMessage({ type: 'error', text: res.error });
        }
      } else if (mode === 'RECOVERY') {
        const res = await resetPassword(email);
        if (res.success) {
          // Neutral feedback message to prevent email enumeration attacks
          setFeedbackMessage({
            type: 'success',
            text: 'Se existir uma conta associada a este e-mail, você receberá as instruções de recuperação.',
          });
        } else if (res.error) {
          setFeedbackMessage({ type: 'error', text: res.error });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) return;
    setIsResending(true);
    setFeedbackMessage(null);
    try {
      const res = await resendConfirmationEmail(email);
      if (res.success) {
        setFeedbackMessage({
          type: 'success',
          text: 'Novo link de confirmação enviado para seu e-mail.',
        });
      } else {
        setFeedbackMessage({
          type: 'error',
          text: res.error || 'Não foi possível reenviar o link no momento.',
        });
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleSelectDemoUser = (userItem: SystemUser) => {
    setDemoUser(userItem);
    closeAuthModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-[#14181F] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <DocuCrewLogo variant="dark" size="sm" showText={false} />
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                Autenticação de Acesso
              </h2>
              <p className="text-xs text-slate-400">
                DocuCrew • Controle de Conformidade & Gestão
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Supabase Connection Status Pill */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-700">Provedor Auth:</span>
            {isConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                Supabase Auth Conectado
              </span>
            ) : isDemoAllowed ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                Modo Demonstração (Local)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                Supabase Indisponível (Fail Closed)
              </span>
            )}
          </div>

          {isConfigured && (
            <span className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]" title={supabaseUrl}>
              {supabaseUrl.replace('https://', '')}
            </span>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Mode Switcher Tabs */}
          {mode !== 'CONFIRM_EMAIL' ? (
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleModeChange('LOGIN')}
                className={`flex-1 py-2 text-center rounded-lg transition-all ${
                  mode === 'LOGIN'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('REGISTER')}
                className={`flex-1 py-2 text-center rounded-lg transition-all ${
                  mode === 'REGISTER'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Criar Conta
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('RECOVERY')}
                className={`flex-1 py-2 text-center rounded-lg transition-all ${
                  mode === 'RECOVERY'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Recuperar
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-2 py-1 bg-slate-50 rounded-lg text-xs text-slate-500">
              <span>Etapa de verificação</span>
              <button
                type="button"
                onClick={() => handleModeChange('LOGIN')}
                className="font-bold text-[#061E2E] hover:underline"
              >
                Voltar para o login
              </button>
            </div>
          )}

          {/* Feedback & Error Alerts */}
          {(feedbackMessage || error) && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2.5 border ${
                feedbackMessage?.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : feedbackMessage?.type === 'info'
                  ? 'bg-blue-50 text-blue-900 border-blue-200'
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}
            >
              {feedbackMessage?.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : feedbackMessage?.type === 'info' ? (
                <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium">{feedbackMessage?.text || error}</div>
            </div>
          )}

          {/* CONFIRM_EMAIL State Screen */}
          {mode === 'CONFIRM_EMAIL' ? (
            <div className="text-center py-4 space-y-4 animate-in fade-in duration-200">
              <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center text-amber-600 mx-auto shadow-xs">
                <Mail className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1.5">
                  Confira seu e-mail
                </h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Enviamos um link de confirmação para o endereço{' '}
                  <strong className="text-slate-900">{email}</strong>. Confirme seu e-mail para ativar sua conta e acessar o DocuCrew.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-left text-xs text-slate-600 space-y-1.5">
                <p className="font-bold text-slate-800">Dicas:</p>
                <ul className="list-disc list-inside text-[11px] space-y-1 text-slate-500">
                  <li>Verifique também sua pasta de lixo eletrônico / spam.</li>
                  <li>O link de ativação expira em alguns minutos.</li>
                </ul>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={isResending}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>{isResending ? 'Reenviando link...' : 'Reenviar e-mail de confirmação'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('LOGIN')}
                  className="w-full py-2.5 px-4 bg-[#14181F] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Voltar para o Login
                </button>
              </div>
            </div>
          ) : (
            /* Standard Auth Forms */
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'REGISTER' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nome Completo
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ex: Carlos Eduardo Silveira"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Perfil / Função Operacional
                    </label>
                    <div className="relative">
                      <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as SystemUser['role'])}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="FISCAL_SEGURANCA">Fiscal de Segurança (TST / Eng.)</option>
                        <option value="ANALISTA_DOCUMENTAL">Analista Documental & RH</option>
                        <option value="ADMINISTRADOR">Administrador Geral</option>
                        <option value="AUDITOR">Auditor de Conformidade</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail Corporativo
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@empresa.com.br"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {mode !== 'RECOVERY' && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Senha de Acesso
                      </label>
                      {mode === 'LOGIN' && (
                        <button
                          type="button"
                          onClick={() => handleModeChange('RECOVERY')}
                          className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          Esqueceu a senha?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo de 8 caracteres"
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                        aria-label="Alternar visualização da senha"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {mode === 'REGISTER' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Confirmar Senha
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          minLength={8}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repita a mesma senha"
                          className={`w-full pl-9 pr-10 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            confirmPassword && password !== confirmPassword
                              ? 'border-rose-300 ring-1 ring-rose-200'
                              : 'border-slate-200'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                          aria-label="Alternar visualização da confirmação de senha"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {confirmPassword && password !== confirmPassword && (
                        <p className="text-[11px] text-rose-600 mt-1">
                          As senhas informadas não coincidem.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-[#14181F] text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>Processando...</span>
                ) : mode === 'LOGIN' ? (
                  <>
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Acessar DocuCrew</span>
                  </>
                ) : mode === 'REGISTER' ? (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Registrar Conta no Supabase</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 text-amber-400" />
                    <span>Enviar Link de Recuperação</span>
                  </>
                )}
              </button>

              {mode === 'RECOVERY' && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => handleModeChange('LOGIN')}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                  >
                    Voltar para o login
                  </button>
                </div>
              )}
            </form>
          )}

          {/* Quick Demo Switcher - Strictly available ONLY when demo mode is explicitly enabled */}
          {isDemoAllowed && (
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Acesso Rápido / Perfis de Demonstração
                </span>
                <span className="text-[10px] text-slate-400">1-clique para teste</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {INITIAL_SYSTEM_USERS.map((demoUser) => {
                  const isActive = currentUser?.id === demoUser.id;
                  return (
                    <button
                      key={demoUser.id}
                      type="button"
                      onClick={() => handleSelectDemoUser(demoUser)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                        isActive
                          ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-400'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {demoUser.name}
                          </p>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">
                          {demoUser.role === 'FISCAL_SEGURANCA'
                            ? 'Fiscal de Segurança (TST)'
                            : demoUser.role === 'ANALISTA_DOCUMENTAL'
                            ? 'Analista Documental'
                            : demoUser.role === 'ADMINISTRADOR'
                            ? 'Administrador Geral'
                            : 'Auditor'}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
