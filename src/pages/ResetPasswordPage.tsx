import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, RefreshCw, KeyRound, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DocuCrewLogo } from '../components/common/DocuCrewLogo';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { session, updateUserPassword, isRecoveryFlowActive } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Check if hash has type=recovery or error
  const [isInvalidLink, setIsInvalidLink] = useState(false);

  useEffect(() => {
    // Check if error is in URL hash (e.g., #error=access_denied&error_code=otp_expired)
    if (window.location.hash.includes('error=')) {
      setIsInvalidLink(true);
      setErrorMsg('O link de recuperação de senha expirou ou é inválido. Por favor, solicite um novo link.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 8) {
      setErrorMsg('A nova senha deve conter no mínimo 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('As senhas digitadas não coincidem. Por favor, verifique.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateUserPassword(password);
      if (res.success) {
        setIsSuccess(true);
      } else {
        setErrorMsg(res.error || 'Falha ao redefinir a senha. Tente novamente.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar alteração de senha';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <DocuCrewLogo variant="dark" size="lg" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Redefinição de Senha
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Defina uma nova credencial segura para a sua conta
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
          {isSuccess ? (
            <div className="text-center py-4 space-y-4 animate-in fade-in duration-200">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Senha alterada com sucesso!
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Sua nova credencial foi registrada. Você já pode acessar a plataforma com a nova senha.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full py-2.5 px-4 bg-[#061E2E] hover:bg-[#0B2A3F] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <span>Acessar Painel DocuCrew</span>
              </button>
            </div>
          ) : isInvalidLink && !session ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center text-rose-600 mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Link Expirado ou Inválido
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  O link de recuperação já foi utilizado ou ultrapassou o limite de tempo estipulado pelo provedor de autenticação.
                </p>
              </div>

              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#061E2E] hover:bg-[#0B2A3F] text-white text-xs font-bold rounded-xl transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar à página inicial</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nova Senha
                </label>
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
                    aria-label="Alternar visualização da nova senha"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-[#061E2E] hover:bg-[#0B2A3F] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando nova senha...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Redefinir e Salvar Senha</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/"
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Voltar para o início</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
