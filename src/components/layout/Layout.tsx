import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../common/Toast';
import { DemoModeBanner } from '../common/DemoModeBanner';
import {
  OrgNotFoundScreen,
  SupabaseErrorScreen,
  ConfigErrorScreen,
  UnauthenticatedScreen,
} from '../common/StateScreens';
import { useAuth } from '../../context/AuthContext';
import { useDocuCrew } from '../../context/DocuCrewContext';
import { RefreshCw } from 'lucide-react';

export const Layout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const { authMode, user, isLoading: isAuthLoading } = useAuth();
  const { dataLoadingState } = useDocuCrew();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Página Geral • Visão Executiva';
      case '/terceirizadas':
        return 'Empresas Terceirizadas';
      case '/trabalhadores':
        return 'Trabalhadores & Conformidade';
      case '/obras':
        return 'Obras, Contratos & Frentes';
      case '/documentos':
        return 'Gestão Master de Documentos';
      case '/analises':
        return 'Fila de Análise e Homologação';
      case '/alertas':
        return 'Central de Alertas & Notificações';
      case '/configuracoes':
        return 'Configurações do Sistema';
      default:
        return 'DocuCrew';
    }
  };

  const renderMainContent = () => {
    // 1. System Configuration Error (missing env, demo disabled)
    if (authMode === 'config_error') {
      return <ConfigErrorScreen />;
    }

    // 2. Supabase Auth Loading
    if (authMode === 'supabase' && isAuthLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <RefreshCw className="w-8 h-8 text-[#061E2E] animate-spin mb-3" />
          <p className="text-sm font-bold text-[#102033]">Verificando credenciais e sessão Supabase...</p>
          <p className="text-xs text-[#587087] mt-1">Garantindo isolamento seguro multi-tenant</p>
        </div>
      );
    }

    // 3. Supabase mode without active session -> Unauthenticated screen (Fail Closed)
    if (authMode === 'supabase' && !user) {
      return <UnauthenticatedScreen />;
    }

    // 4. Authenticated user but no organization found in organization_members (Fail Closed)
    if (authMode === 'supabase' && dataLoadingState === 'ORG_NOT_FOUND') {
      return <OrgNotFoundScreen />;
    }

    // 5. Supabase query failure / error state (Fail Closed)
    if (authMode === 'supabase' && dataLoadingState === 'ERROR') {
      return <SupabaseErrorScreen />;
    }

    // 6. Normal authenticated operation or explicit Demo mode
    return <Outlet />;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <DemoModeBanner />

      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <Header
          onMenuClick={() => setIsMobileOpen(true)}
          pageTitle={getPageTitle()}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderMainContent()}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
};

