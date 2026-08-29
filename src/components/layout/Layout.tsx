import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../common/Toast';

export const Layout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
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
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
};
