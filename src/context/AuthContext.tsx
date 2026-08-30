import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured, SUPABASE_URL } from '../lib/supabaseClient';
import { SystemUser } from '../types';
import { INITIAL_SYSTEM_USERS } from '../data/mockData';

export type AuthMode = 'supabase' | 'demo';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  currentUser: SystemUser;
  authMode: AuthMode;
  isConfigured: boolean;
  isLoading: boolean;
  error: string | null;
  supabaseUrl: string;
  isAuthModalOpen: boolean;
  
  // Actions
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string, role?: SystemUser['role']) => Promise<{ success: boolean; error?: string; requireVerification?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  setDemoUser: (userOrId: string | SystemUser) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('demo');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Active user representation in DocuCrew
  const [currentUser, setCurrentUser] = useState<SystemUser>(INITIAL_SYSTEM_USERS[0]);

  const configured = isSupabaseConfigured();
  const supabase = getSupabaseClient();

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
      // Revert to default fiscal demo profile
      setCurrentUser(INITIAL_SYSTEM_USERS[0]);
      setAuthMode('demo');
    }
  }, []);

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
          }
        }
      } catch (err) {
        console.warn('Erro ao checar autenticação Supabase:', err);
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
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
        if (mounted) {
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
      // If demo mode, check mock accounts
      const match = INITIAL_SYSTEM_USERS.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (match) {
        setCurrentUser(match);
        setAuthMode('demo');
        setIsAuthModalOpen(false);
        return { success: true };
      }
      // Demo mock fallback allow signin
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
    syncUserWithSystem(null);
    setIsLoading(false);
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    if (!configured || !supabase) {
      return { success: true };
    }

    try {
      const { error: sbError } = await supabase.auth.resetPasswordForEmail(email.trim());
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

  const setDemoUser = (userOrId: string | SystemUser) => {
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
        isLoading,
        error,
        supabaseUrl: SUPABASE_URL,
        isAuthModalOpen,
        signIn,
        signUp,
        signOut,
        resetPassword,
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
  switch (err.message) {
    case 'Invalid login credentials':
      return 'E-mail ou senha incorretos. Verifique suas credenciais.';
    case 'User already registered':
      return 'Este e-mail já está cadastrado no sistema.';
    case 'Password should be at least 6 characters':
      return 'A senha deve conter no mínimo 6 caracteres.';
    case 'Email rate limit exceeded':
      return 'Limite de requisições excedido. Aguarde alguns instantes.';
    case 'Invalid email':
      return 'Formato de e-mail inválido.';
    default:
      return err.message || 'Ocorreu um erro durante a autenticação.';
  }
}
