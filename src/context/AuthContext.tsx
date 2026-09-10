import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured, isDemoModeAllowed, SUPABASE_URL } from '../lib/supabaseClient';
import { SystemUser } from '../types';
import { INITIAL_SYSTEM_USERS } from '../data/mockData';

export type AuthMode = 'supabase' | 'demo' | 'config_error';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  currentUser: SystemUser | null;
  authMode: AuthMode;
  isConfigured: boolean;
  isDemoAllowed: boolean;
  isLoading: boolean;
  error: string | null;
  supabaseUrl: string;
  isAuthModalOpen: boolean;
  isRecoveryFlowActive: boolean;
  
  // Actions
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string, role?: SystemUser['role']) => Promise<{ success: boolean; error?: string; requireVerification?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateUserPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  resendConfirmationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  setIsRecoveryFlowActive: (active: boolean) => void;
  setDemoUser: (userOrId: string | SystemUser) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const configured = isSupabaseConfigured();
  const demoAllowed = isDemoModeAllowed();
  const supabase = getSupabaseClient();

  // Strict fail-closed initial state:
  // If Supabase is configured -> starts in 'supabase' mode, unauthenticated (null), loading session.
  // If Supabase is NOT configured -> only enters 'demo' if VITE_ENABLE_DEMO_MODE=true. Otherwise 'config_error'.
  const initialMode: AuthMode = configured ? 'supabase' : (demoAllowed ? 'demo' : 'config_error');

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [isLoading, setIsLoading] = useState<boolean>(configured);
  const [error, setError] = useState<string | null>(
    initialMode === 'config_error'
      ? 'SYSTEM_CONFIGURATION_ERROR: Supabase URL ou Anon Key não configuradas no ambiente e o modo demonstração está desabilitado.'
      : null
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isRecoveryFlowActive, setIsRecoveryFlowActive] = useState<boolean>(false);

  // Active user representation in DocuCrew (strictly null when unauthenticated in Supabase mode)
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(
    initialMode === 'demo' ? INITIAL_SYSTEM_USERS[0] : null
  );

  const syncUserWithSystem = useCallback((sbUser: User | null) => {
    if (sbUser) {
      const meta = sbUser.user_metadata || {};
      const customName = meta.name || meta.full_name || sbUser.email?.split('@')[0] || 'Usuário DocuCrew';
      const customRole: SystemUser['role'] = meta.role || 'FISCAL_SEGURANCA';

      setCurrentUser({
        id: sbUser.id,
        name: customName,
        email: sbUser.email || 'usuario@empresa.com.br',
        role: customRole,
        status: 'ATIVO',
        lastAccess: 'Agora (Supabase Auth)',
      });
      setAuthMode('supabase');
    } else {
      // Unauthenticated state
      if (configured) {
        // FAIL CLOSED: No user in Supabase mode -> never fallback to demo
        setCurrentUser(null);
        setAuthMode('supabase');
      } else if (demoAllowed) {
        setCurrentUser(INITIAL_SYSTEM_USERS[0]);
        setAuthMode('demo');
      } else {
        setCurrentUser(null);
        setAuthMode('config_error');
      }
    }
  }, [configured, demoAllowed]);

  // Initialize Supabase Auth Session
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!configured || !supabase) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) {
          console.warn('Erro ao restaurar sessão Supabase:', sessionErr.message);
        }

        if (mounted) {
          if (data?.session?.user) {
            setSession(data.session);
            setUser(data.session.user);
            syncUserWithSystem(data.session.user);
          } else {
            setSession(null);
            setUser(null);
            syncUserWithSystem(null);
          }
        }
      } catch (err) {
        console.warn('Erro ao checar autenticação Supabase:', err);
        if (mounted) {
          setSession(null);
          setUser(null);
          syncUserWithSystem(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    // Listen to real-time auth changes
    let subscription: { unsubscribe: () => void } | null = null;

    if (configured && supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange((event, currentSession) => {
        if (mounted) {
          if (event === 'PASSWORD_RECOVERY') {
            setIsRecoveryFlowActive(true);
          } else if (event === 'SIGNED_OUT') {
            setIsRecoveryFlowActive(false);
          }
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          syncUserWithSystem(currentSession?.user ?? null);
          setIsLoading(false);
        }
      });
      subscription = authListener.subscription;
    }

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [configured, supabase, syncUserWithSystem]);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setIsLoading(true);

    if (!configured || !supabase) {
      setIsLoading(false);
      if (!demoAllowed) {
        const msg = 'SYSTEM_CONFIGURATION_ERROR: Supabase não está configurado e o modo demonstração está desabilitado.';
        setError(msg);
        return { success: false, error: msg };
      }
      // If demo mode is explicitly enabled, allow mock login
      const match = INITIAL_SYSTEM_USERS.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (match) {
        setCurrentUser(match);
        setAuthMode('demo');
        setIsAuthModalOpen(false);
        return { success: true };
      }
      setCurrentUser({
        id: `demo-${Date.now()}`,
        name: email.split('@')[0],
        email: email.trim(),
        role: 'FISCAL_SEGURANCA',
        status: 'ATIVO',
        lastAccess: 'Agora (Demonstração)',
      });
      setAuthMode('demo');
      setIsAuthModalOpen(false);
      return { success: true };
    }

    try {
      const { data, error: sbError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (sbError) {
        const errorMsg = formatSupabaseError(sbError);
        setError(errorMsg);
        setIsLoading(false);
        return { success: false, error: errorMsg };
      }

      setUser(data.user);
      setSession(data.session);
      syncUserWithSystem(data.user);
      setIsLoading(false);
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na conexão com Supabase Auth';
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: SystemUser['role'] = 'FISCAL_SEGURANCA'
  ): Promise<{ success: boolean; error?: string; requireVerification?: boolean }> => {
    setError(null);
    setIsLoading(true);

    if (!configured || !supabase) {
      setIsLoading(false);
      if (!demoAllowed) {
        const msg = 'SYSTEM_CONFIGURATION_ERROR: Supabase não está configurado e o modo demonstração está desabilitado.';
        setError(msg);
        return { success: false, error: msg };
      }
      const newUser: SystemUser = {
        id: `demo-${Date.now()}`,
        name: name.trim() || email.split('@')[0],
        email: email.trim(),
        role,
        status: 'ATIVO',
        lastAccess: 'Agora (Demonstração)',
      };
      setCurrentUser(newUser);
      setAuthMode('demo');
      setIsAuthModalOpen(false);
      return { success: true };
    }

    try {
      const { data, error: sbError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
            full_name: name.trim(),
            role,
          },
        },
      });

      if (sbError) {
        const errorMsg = formatSupabaseError(sbError);
        setError(errorMsg);
        setIsLoading(false);
        return { success: false, error: errorMsg };
      }

      setIsLoading(false);

      if (data.session) {
        setUser(data.user);
        setSession(data.session);
        syncUserWithSystem(data.user);
        setIsAuthModalOpen(false);
        return { success: true };
      } else {
        // Confirmation email required
        return {
          success: true,
          requireVerification: true,
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar no Supabase';
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    if (configured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Erro ao deslogar do Supabase:', err);
      }
    }
    setUser(null);
    setSession(null);
    setIsRecoveryFlowActive(false);
    syncUserWithSystem(null);
    setIsLoading(false);
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    if (!configured || !supabase) {
      if (!demoAllowed) {
        return { success: false, error: 'SYSTEM_CONFIGURATION_ERROR: Supabase não está configurado.' };
      }
      return { success: true };
    }

    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: sbError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      if (sbError) {
        const errorMsg = formatSupabaseError(sbError);
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao solicitar recuperação de senha';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const updateUserPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    if (!configured || !supabase) {
      return { success: false, error: 'Supabase não está configurado.' };
    }
    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: 'A nova senha deve ter no mínimo 8 caracteres.' };
    }

    try {
      const { error: sbError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (sbError) {
        const errorMsg = formatSupabaseError(sbError);
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
      setIsRecoveryFlowActive(false);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao atualizar senha';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const resendConfirmationEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    if (!configured || !supabase) {
      return { success: false, error: 'Supabase não está configurado.' };
    }
    try {
      const { error: sbError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });
      if (sbError) {
        const errorMsg = formatSupabaseError(sbError);
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao reenviar confirmação';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const setDemoUser = (userOrId: string | SystemUser) => {
    if (!demoAllowed) {
      console.warn('Tentativa de ativar usuário demo rejeitada: modo demonstração desabilitado.');
      return;
    }
    if (typeof userOrId === 'string') {
      const found = INITIAL_SYSTEM_USERS.find((u) => u.id === userOrId);
      if (found) {
        setCurrentUser(found);
      }
    } else {
      setCurrentUser(userOrId);
    }
    setAuthMode('demo');
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => {
    setError(null);
    setIsAuthModalOpen(false);
  };
  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        currentUser,
        authMode,
        isConfigured: configured,
        isDemoAllowed: demoAllowed,
        isLoading,
        error,
        supabaseUrl: SUPABASE_URL,
        isAuthModalOpen,
        isRecoveryFlowActive,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateUserPassword,
        resendConfirmationEmail,
        setIsRecoveryFlowActive,
        setDemoUser,
        openAuthModal,
        closeAuthModal,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};

function formatSupabaseError(err: AuthError): string {
  const msg = err.message || '';
  if (msg.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos. Verifique suas credenciais.';
  }
  if (msg.includes('User already registered')) {
    return 'Este e-mail já está cadastrado no sistema.';
  }
  if (msg.includes('Password should be at least')) {
    return 'A senha deve conter no mínimo 8 caracteres.';
  }
  if (msg.toLowerCase().includes('rate limit')) {
    return 'Limite de requisições excedido. Por favor, aguarde alguns instantes antes de tentar novamente.';
  }
  if (msg.includes('Invalid email') || msg.includes('valid email')) {
    return 'Formato de e-mail inválido.';
  }
  if (msg.includes('Email not confirmed')) {
    return 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada para ativar a conta.';
  }
  return msg || 'Ocorreu um erro durante a autenticação.';
}
