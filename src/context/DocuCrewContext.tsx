import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
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

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

interface DocuCrewContextType {
  contractors: Contractor[];
  worksites: WorkSite[];
  workers: Worker[];
  documents: WorkerDocument[];
  alerts: AlertNotification[];
  notificationLogs: NotificationHistoryLog[];
  documentTypes: DocumentTypeDefinition[];
  users: SystemUser[];
  
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
  sendContractorNotification: (contractorId: string, channel: 'WHATSAPP' | 'EMAIL' | 'PORTAL', subject: string) => void;
  markAlertAsRead: (alertId: string) => void;
  markAllAlertsAsRead: () => void;
}

const DocuCrewContext = createContext<DocuCrewContextType | undefined>(undefined);

export const DocuCrewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [contractors, setContractors] = useState<Contractor[]>(INITIAL_CONTRACTORS);
  const [worksites, setWorksites] = useState<WorkSite[]>(INITIAL_WORKSITES);
  const [workers, setWorkers] = useState<Worker[]>(INITIAL_WORKERS);
  const [documents, setDocuments] = useState<WorkerDocument[]>(INITIAL_DOCUMENTS);
  const [alerts, setAlerts] = useState<AlertNotification[]>(INITIAL_ALERTS);
  const [notificationLogs, setNotificationLogs] = useState<NotificationHistoryLog[]>(INITIAL_NOTIFICATION_LOGS);
  const [documentTypes] = useState<DocumentTypeDefinition[]>(INITIAL_DOCUMENT_TYPES);
  const [users] = useState<SystemUser[]>(INITIAL_SYSTEM_USERS);

  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('ALL');
  const [selectedContractorFilter, setSelectedContractorFilter] = useState<string>('ALL');

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (title: string, message: string, type: ToastMessage['type'] = 'success') => {
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
    const hasExpired = workerDocs.some((d) => d.status === 'VENCIDO');
    const hasPending = workerDocs.some((d) => d.status === 'PENDENTE');
    const hasRejected = workerDocs.some((d) => d.status === 'RECUSADO');

    let blockReason: string | undefined = undefined;
    if (hasExpired) {
      const expDoc = workerDocs.find((d) => d.status === 'VENCIDO');
      blockReason = `${expDoc?.documentTypeName || 'Documento'} vencido.`;
    } else if (hasRejected) {
      const rejDoc = workerDocs.find((d) => d.status === 'RECUSADO');
      blockReason = `${rejDoc?.documentTypeName || 'Documento'} recusado: ${rejDoc?.rejectionReason || 'Não atende requisitos'}`;
    } else if (hasPending) {
      const penDoc = workerDocs.find((d) => d.status === 'PENDENTE');
      blockReason = `${penDoc?.documentTypeName || 'Documento obrigatório'} pendente de envio.`;
    }

    const isBlocked = hasExpired || hasPending || hasRejected;

    setWorkers((prevWorkers) =>
      prevWorkers.map((w) => {
        if (w.id === workerId) {
          const underReview = workerDocs.filter((d) => d.status === 'AGUARDANDO_ANALISE').length;
          const approved = workerDocs.filter((d) => d.status === 'APROVADO' || d.status === 'PROXIMO_VENCIMENTO').length;
          const pending = workerDocs.filter((d) => d.status === 'PENDENTE').length;
          const expired = workerDocs.filter((d) => d.status === 'VENCIDO').length;

          return {
            ...w,
            status: isBlocked ? 'BLOQUEADO' : 'LIBERADO',
            blockReason: isBlocked ? blockReason : undefined,
            underReviewDocumentsCount: underReview,
            approvedDocumentsCount: approved,
            pendingDocumentsCount: pending,
            expiredDocumentsCount: expired,
          };
        }
        return w;
      })
    );
  };

  const approveDocument = (documentId: string, reviewedBy = 'Fiscal Roberto Farias (TST)') => {
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

  const rejectDocument = (documentId: string, reason: string, reviewedBy = 'Fiscal Roberto Farias (TST)') => {
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

  const requestCorrection = (documentId: string, notes: string, reviewedBy = 'Fiscal Roberto Farias (TST)') => {
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
      sentAt: `Hoje às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      status: 'ENTREGUE',
    };

    setNotificationLogs((prev) => [newLog, ...prev]);

    showToast(
      'Cobrança Enviada com Sucesso',
      `Notificação via ${channel} disparada para ${contractor?.tradeName || 'terceirizada'}.`,
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
