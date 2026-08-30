import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  Contractor,
  WorkSite,
  Worker,
  WorkerDocument,
  DocumentTypeDefinition,
  AlertNotification,
  NotificationHistoryLog,
  SystemUser,
  DocumentStatus,
} from '../types';
import {
  INITIAL_CONTRACTORS,
  INITIAL_WORKSITES,
  INITIAL_WORKERS,
  INITIAL_DOCUMENTS,
  INITIAL_ALERTS,
  INITIAL_NOTIFICATION_LOGS,
  INITIAL_DOCUMENT_TYPES,
  INITIAL_SYSTEM_USERS,
} from '../data/mockData';
import { evaluateWorkerCompliance } from '../domain/workerCompliance';
import { useAuth } from './AuthContext';
import { getSupabaseClient } from '../lib/supabaseClient';
import {
  fetchUserOrganization,
  loadSupabaseDashboardData,
} from '../services/supabaseDataService';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

export type DataLoadingState =
  | 'IDLE'
  | 'LOADING'
  | 'SUCCESS'
  | 'ERROR'
  | 'ORG_NOT_FOUND'
  | 'EMPTY';

interface DocuCrewContextType {
  contractors: Contractor[];
  worksites: WorkSite[];
  workers: Worker[];
  documents: WorkerDocument[];
  alerts: AlertNotification[];
  notificationLogs: NotificationHistoryLog[];
  documentTypes: DocumentTypeDefinition[];
  users: SystemUser[];

  // Organization & Supabase State
  organizationName: string;
  dataLoadingState: DataLoadingState;
  dataError: string | null;
  isUsingSupabaseData: boolean;
  reloadSupabaseData: () => Promise<void>;

  // Global Filters for Dashboard
  selectedSiteFilter: string; // 'ALL' or siteId
  setSelectedSiteFilter: (siteId: string) => void;
  selectedContractorFilter: string; // 'ALL' or contractorId
  setSelectedContractorFilter: (contractorId: string) => void;

  // Toast notifications
  toasts: ToastMessage[];
  showToast: (title: string, message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;

  // Actions
  approveDocument: (documentId: string, reviewedBy?: string) => void;
  rejectDocument: (documentId: string, reason: string, reviewedBy?: string) => void;
  requestCorrection: (documentId: string, notes: string, reviewedBy?: string) => void;
  sendContractorNotification: (
    contractorId: string,
    channel: 'WHATSAPP' | 'EMAIL' | 'PORTAL',
    subject: string
  ) => void;
  markAlertAsRead: (alertId: string) => void;
  markAllAlertsAsRead: () => void;
}

const DocuCrewContext = createContext<DocuCrewContextType | undefined>(undefined);

export const DocuCrewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, authMode, isConfigured } = useAuth();

  const [contractors, setContractors] = useState<Contractor[]>(INITIAL_CONTRACTORS);
  const [worksites, setWorksites] = useState<WorkSite[]>(INITIAL_WORKSITES);
  const [workers, setWorkers] = useState<Worker[]>(INITIAL_WORKERS);
  const [documents, setDocuments] = useState<WorkerDocument[]>(INITIAL_DOCUMENTS);
  const [alerts, setAlerts] = useState<AlertNotification[]>(INITIAL_ALERTS);
  const [notificationLogs, setNotificationLogs] = useState<NotificationHistoryLog[]>(
    INITIAL_NOTIFICATION_LOGS
  );
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeDefinition[]>(
    INITIAL_DOCUMENT_TYPES
  );
  const [users] = useState<SystemUser[]>(INITIAL_SYSTEM_USERS);

  // Organization & Loading state
  const [organizationName, setOrganizationName] = useState<string>('DocuCrew Demonstração');
  const [dataLoadingState, setDataLoadingState] = useState<DataLoadingState>('SUCCESS');
  const [dataError, setDataError] = useState<string | null>(null);
  const [isUsingSupabaseData, setIsUsingSupabaseData] = useState<boolean>(false);

  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('ALL');
  const [selectedContractorFilter, setSelectedContractorFilter] = useState<string>('ALL');

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (
    title: string,
    message: string,
    type: ToastMessage['type'] = 'success'
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper to re-evaluate worker status based on current documents
  const recalculateWorkerState = (workerId: string, currentDocs: WorkerDocument[]) => {
    const workerDocs = currentDocs.filter((d) => d.workerId === workerId);

    setWorkers((prevWorkers) =>
      prevWorkers.map((w) => {
        if (w.id === workerId) {
          const compliance = evaluateWorkerCompliance(workerDocs, w.totalRequiredDocuments);

          return {
            ...w,
            status: compliance.status,
            blockReason: compliance.blockReason,
            underReviewDocumentsCount: compliance.underReviewDocumentsCount,
            approvedDocumentsCount: compliance.approvedDocumentsCount,
            pendingDocumentsCount: compliance.pendingDocumentsCount,
            expiredDocumentsCount: compliance.expiredDocumentsCount,
          };
        }
        return w;
      })
    );
  };

  // Main loader for Supabase data
  const loadDataFromSupabase = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!isConfigured || !supabase || !user) {
      // Revert to demo mode gracefully
      setOrganizationName('DocuCrew Demonstração');
      setContractors(INITIAL_CONTRACTORS);
      setWorksites(INITIAL_WORKSITES);
      setWorkers(INITIAL_WORKERS);
      setDocuments(INITIAL_DOCUMENTS);
      setAlerts(INITIAL_ALERTS);
      setDocumentTypes(INITIAL_DOCUMENT_TYPES);
      setIsUsingSupabaseData(false);
      setDataLoadingState('SUCCESS');
      setDataError(null);
      return;
    }

    setDataLoadingState('LOADING');
    setDataError(null);

    try {
      // 1. Fetch Organization linked to user
      const orgResult = await fetchUserOrganization(supabase, user.id);

      if (orgResult.error) {
        setDataError(orgResult.error);
        setDataLoadingState('ERROR');
        return;
      }

      if (!orgResult.found || !orgResult.organizationId) {
        setOrganizationName(orgResult.organizationName || 'DocuCrew Demonstração');
        setDataLoadingState('ORG_NOT_FOUND');
        setIsUsingSupabaseData(false);
        return;
      }

      setOrganizationName(orgResult.organizationName);

      // 2. Fetch Operational Database Tables for the organization
      const dashboardResult = await loadSupabaseDashboardData(
        supabase,
        orgResult.organizationId
      );

      if (!dashboardResult.success || !dashboardResult.data) {
        setDataError(dashboardResult.error || 'Não foi possível carregar os dados operacionais.');
        setDataLoadingState('ERROR');
        // Keep fallback data so screen is never blank
        return;
      }

      const {
        contractors: dbContractors,
        worksites: dbSites,
        workers: dbWorkers,
        documents: dbDocs,
        documentTypes: dbDocTypes,
        alerts: dbAlerts,
      } = dashboardResult.data;

      // Update state with real Supabase data
      setContractors(dbContractors.length > 0 ? dbContractors : INITIAL_CONTRACTORS);
      setWorksites(dbSites.length > 0 ? dbSites : INITIAL_WORKSITES);
      setWorkers(dbWorkers.length > 0 ? dbWorkers : INITIAL_WORKERS);
      setDocuments(dbDocs.length > 0 ? dbDocs : INITIAL_DOCUMENTS);
      if (dbDocTypes.length > 0) {
        setDocumentTypes(dbDocTypes);
      }
      if (dbAlerts.length > 0) {
        setAlerts(dbAlerts);
      }

      setIsUsingSupabaseData(true);

      if (dashboardResult.isEmpty) {
        setDataLoadingState('EMPTY');
      } else {
        setDataLoadingState('SUCCESS');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na conexão com o Supabase';
      console.warn('Erro ao carregar dados do Supabase:', msg);
      setDataError(msg);
      setDataLoadingState('ERROR');
    }
  }, [isConfigured, user]);

  // Synchronize data whenever user session or mode changes
  useEffect(() => {
    if (authMode === 'supabase' && user) {
      loadDataFromSupabase();
    } else {
      // Demo mode fallback
      setOrganizationName('DocuCrew Demonstração');
      setContractors(INITIAL_CONTRACTORS);
      setWorksites(INITIAL_WORKSITES);
      setWorkers(INITIAL_WORKERS);
      setDocuments(INITIAL_DOCUMENTS);
      setAlerts(INITIAL_ALERTS);
      setDocumentTypes(INITIAL_DOCUMENT_TYPES);
      setIsUsingSupabaseData(false);
      setDataLoadingState('SUCCESS');
      setDataError(null);
    }
  }, [authMode, user, loadDataFromSupabase]);

  const approveDocument = (
    documentId: string,
    reviewedBy = 'Fiscal Roberto Farias (TST)'
  ) => {
    let affectedWorkerId = '';
    let docName = '';
    let workerName = '';

    setDocuments((prevDocs) => {
      const nextDocs = prevDocs.map((doc) => {
        if (doc.id === documentId) {
          affectedWorkerId = doc.workerId;
          docName = doc.documentTypeName;
          workerName = doc.workerName;
          return {
            ...doc,
            status: 'APROVADO' as DocumentStatus,
            reviewedBy,
            reviewedAt: new Date().toISOString().split('T')[0],
            rejectionReason: undefined,
          };
        }
        return doc;
      });

      if (affectedWorkerId) {
        setTimeout(() => recalculateWorkerState(affectedWorkerId, nextDocs), 0);
      }
      return nextDocs;
    });

    showToast(
      'Documento Aprovado com Sucesso',
      `O documento "${docName}" de ${workerName} foi validado e marcado como APROVADO.`,
      'success'
    );
  };

  const rejectDocument = (
    documentId: string,
    reason: string,
    reviewedBy = 'Fiscal Roberto Farias (TST)'
  ) => {
    let affectedWorkerId = '';
    let docName = '';
    let workerName = '';

    setDocuments((prevDocs) => {
      const nextDocs = prevDocs.map((doc) => {
        if (doc.id === documentId) {
          affectedWorkerId = doc.workerId;
          docName = doc.documentTypeName;
          workerName = doc.workerName;
          return {
            ...doc,
            status: 'RECUSADO' as DocumentStatus,
            rejectionReason: reason,
            reviewedBy,
            reviewedAt: new Date().toISOString().split('T')[0],
          };
        }
        return doc;
      });

      if (affectedWorkerId) {
        setTimeout(() => recalculateWorkerState(affectedWorkerId, nextDocs), 0);
      }
      return nextDocs;
    });

    // Add alert notification
    const newAlert: AlertNotification = {
      id: `alt-${Date.now()}`,
      severity: 'CRITICA',
      type: 'DOCUMENTO_FALTANTE',
      title: `Documento Recusado: ${docName}`,
      description: `${workerName} foi bloqueado devido à reprovação de ${docName}. Motivo: ${reason}`,
      workerName,
      contractorName: 'Terceirizada',
      documentName: docName,
      createdAt: 'Agora mesmo',
      isRead: false,
      actionRequired: 'Solicitar reenvio corrigido com urgência.',
    };
    setAlerts((prev) => [newAlert, ...prev]);

    showToast(
      'Documento Recusado e Bloqueio Registrado',
      `O documento "${docName}" foi reprovado com motivo: "${reason}". O trabalhador foi mantido como BLOQUEADO.`,
      'error'
    );
  };

  const requestCorrection = (
    documentId: string,
    notes: string,
    reviewedBy = 'Fiscal Roberto Farias (TST)'
  ) => {
    let affectedWorkerId = '';
    let docName = '';
    let workerName = '';

    setDocuments((prevDocs) => {
      const nextDocs = prevDocs.map((doc) => {
        if (doc.id === documentId) {
          affectedWorkerId = doc.workerId;
          docName = doc.documentTypeName;
          workerName = doc.workerName;
          return {
            ...doc,
            status: 'PENDENTE' as DocumentStatus,
            correctionNotes: notes,
            rejectionReason: `Correção solicitada: ${notes}`,
            reviewedBy,
            reviewedAt: new Date().toISOString().split('T')[0],
          };
        }
        return doc;
      });

      if (affectedWorkerId) {
        setTimeout(() => recalculateWorkerState(affectedWorkerId, nextDocs), 0);
      }
      return nextDocs;
    });

    showToast(
      'Solicitação de Correção Enviada',
      `Uma notificação de ajuste para "${docName}" de ${workerName} foi enviada para a prestadora.`,
      'warning'
    );
  };

  const sendContractorNotification = (
    contractorId: string,
    channel: 'WHATSAPP' | 'EMAIL' | 'PORTAL',
    subject: string
  ) => {
    const contractor = contractors.find((c) => c.id === contractorId);
    const recipient =
      channel === 'WHATSAPP'
        ? contractor?.responsiblePhone || '(11) 99999-0000'
        : channel === 'EMAIL'
        ? contractor?.responsibleEmail || 'contato@empresa.com.br'
        : 'Painel da Terceirizada';

    const newLog: NotificationHistoryLog = {
      id: `log-${Date.now()}`,
      recipient,
      contractorName: contractor?.tradeName || 'Terceirizada',
      channel,
      subject,
      sentAt: `Hoje às ${new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      status: 'ENTREGUE',
    };

    setNotificationLogs((prev) => [newLog, ...prev]);

    showToast(
      'Cobrança Enviada com Sucesso',
      `Notificação via ${channel} disparada para ${
        contractor?.tradeName || 'terceirizada'
      }.`,
      'info'
    );
  };

  const markAlertAsRead = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a))
    );
  };

  const markAllAlertsAsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    showToast('Alertas Atualizados', 'Todos os alertas foram marcados como lidos.', 'info');
  };

  return (
    <DocuCrewContext.Provider
      value={{
        contractors,
        worksites,
        workers,
        documents,
        alerts,
        notificationLogs,
        documentTypes,
        users,
        organizationName,
        dataLoadingState,
        dataError,
        isUsingSupabaseData,
        reloadSupabaseData: loadDataFromSupabase,
        selectedSiteFilter,
        setSelectedSiteFilter,
        selectedContractorFilter,
        setSelectedContractorFilter,
        toasts,
        showToast,
        removeToast,
        approveDocument,
        rejectDocument,
        requestCorrection,
        sendContractorNotification,
        markAlertAsRead,
        markAllAlertsAsRead,
      }}
    >
      {children}
    </DocuCrewContext.Provider>
  );
};

export const useDocuCrew = () => {
  const context = useContext(DocuCrewContext);
  if (!context) {
    throw new Error('useDocuCrew must be used within a DocuCrewProvider');
  }
  return context;
};
