import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DocuCrewProvider } from './context/DocuCrewContext';
import { Layout } from './components/layout/Layout';
import { AuthModal } from './components/auth/AuthModal';
import { DashboardPage } from './pages/DashboardPage';
import { TerceirizadasPage } from './pages/TerceirizadasPage';
import { TrabalhadoresPage } from './pages/TrabalhadoresPage';
import { ObrasPage } from './pages/ObrasPage';
import { DocumentosPage } from './pages/DocumentosPage';
import { AnalisesPage } from './pages/AnalisesPage';
import { AlertasPage } from './pages/AlertasPage';
import { ConfiguracoesPage } from './pages/ConfiguracoesPage';

export default function App() {
  return (
    <AuthProvider>
      <DocuCrewProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="terceirizadas" element={<TerceirizadasPage />} />
              <Route path="trabalhadores" element={<TrabalhadoresPage />} />
              <Route path="obras" element={<ObrasPage />} />
              <Route path="documentos" element={<DocumentosPage />} />
              <Route path="analises" element={<AnalisesPage />} />
              <Route path="alertas" element={<AlertasPage />} />
              <Route path="configuracoes" element={<ConfiguracoesPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
          <AuthModal />
        </BrowserRouter>
      </DocuCrewProvider>
    </AuthProvider>
  );
}
