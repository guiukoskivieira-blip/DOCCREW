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
  ContractorStatus,
  WorkSite,
  Worker,
  WorkerDocument,
  DocumentTypeDefinition,
  AlertNotification,
  NotificationHistoryLog,
  SystemUser,
  DocumentStatus,
  WorkerRole,
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
  INITIAL_WORKER_ROLES,
} from '../data/mockData';
import { evaluateWorkerCompliance } from '../domain/workerCompliance';
import { useAuth } from './AuthContext';
import { getSupabaseClient, isDemoModeAllowed } from '../lib/supabaseClient';
import {
  fetchUserOrganization,
  loadSupabaseDashboardData,
} from '../services/supabaseDataService';
import {
  createContractor,
  createWorker,
  createSite,
  createDocumentType,
  updateDocumentType,
  uploadWorkerDocument,
  getDocumentDownloadUrl,
  updateOrganizationProfile,
  updateDocumentStatus,
  createFirstOrganization,
  CreateContractorPayload,
  CreateWorkerPayload,
  CreateSitePayload,
  CreateDocumentTypePayload,
  UploadWorkerDocumentPayload,
} from '../services/supabaseMutationService';

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
  workerRoles: WorkerRole[];
  users: SystemUser[];

  // Organization & Supabase State
  organizationId: string | null;
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
  approveDocument: (documentId: string, reviewedBy?: string) => Promise<{ success: boolean; error?: string }>;
  rejectDocument: (documentId: string, reason: string, reviewedBy?: string) => Promise<{ success: boolean; error?: string }>;
  requestCorrection: (documentId: string, notes: string, reviewedBy?: string) => Promise<{ success: boolean; error?: string }>;
  sendContractorNotification: (
    contractorId: string,
    channel: 'WHATSAPP' | 'EMAIL' | 'PORTAL',
    subject: string
  ) => void;
  markAlertAsRead: (alertId: string) => void;
  markAllAlertsAsRead: () => void;

  // Mutation Actions
  addContractor: (payload: CreateContractorPayload) => Promise<{ success: boolean; error?: string }>;
  addWorker: (payload: CreateWorkerPayload) => Promise<{ success: boolean; workerCreated?: boolean; error?: string }>;
  addSite: (payload: CreateSitePayload) => Promise<{ success: boolean; error?: string }>;
  addDocumentType: (payload: CreateDocumentTypePayload) => Promise<{ success: boolean; error?: string }>;
  editDocumentType: (docTypeId: string, payload: Partial<CreateDocumentTypePayload>) => Promise<{ success: boolean; error?: string }>;
  uploadDocument: (file: File, payload: UploadWorkerDocumentPayload) => Promise<{ success: boolean; error?: string }>;
  downloadDocumentFile: (filePath?: string) => Promise<{ success: boolean; url?: string; error?: string }>;
  updateOrgProfile: (payload: { name: string; slug?: string }) => Promise<{ success: boolean; error?: string }>;
  createCompanyOnboarding: (name: string) => Promise<{ success: boolean; error?: string; alreadyHasOrg?: boolean }>;
}

const DocuCrewContext = createContext<DocuCrewContextType | undefined>(undefined);

export const DocuCrewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, authMode, isConfigured } = useAuth();

  // Operational state: initialized EMPTY. Never populated with mocks unless authMode === 'demo' and allowed.
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [worksites, setWorksites] = useState<WorkSite[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [documents, setDocuments] = useState<WorkerDocument[]>([]);
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [notificationLogs, setNotificationLogs] = useState<NotificationHistoryLog[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeDefinition[]>([]);
  const [workerRoles, setWorkerRoles] = useState<WorkerRole[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);

  // Organization & Loading state
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [dataLoadingState, setDataLoadingState] = useState<DataLoadingState>('IDLE');
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

  // Helper to completely purge operational and tenant data (FAIL CLOSED)
  const clearOperationalData = useCallback(() => {
    setContractors([]);
    setWorksites([]);
    setWorkers([]);
    setDocuments([]);
    setAlerts([]);
    setNotificationLogs([]);
    setDocumentTypes([]);
    setWorkerRoles([]);
    setUsers([]);
    setOrganizationId(null);
    setOrganizationName('');
    setIsUsingSupabaseData(false);
  }, []);

  // Helper to load explicit demo data ONLY when explicitly authorized
  const loadDemoData = useCallback(() => {
    if (!isDemoModeAllowed()) {
      clearOperationalData();
      setDataLoadingState('ERROR');
      setDataError('O modo demonstração está desabilitado.');
      return;
    }
    setContractors(INITIAL_CONTRACTORS);
    setWorksites(INITIAL_WORKSITES);
    setWorkers(INITIAL_WORKERS);
    setDocuments(INITIAL_DOCUMENTS);
    setAlerts(INITIAL_ALERTS);
    setNotificationLogs(INITIAL_NOTIFICATION_LOGS);
    setDocumentTypes(INITIAL_DOCUMENT_TYPES);
    setWorkerRoles(INITIAL_WORKER_ROLES);
    setUsers(INITIAL_SYSTEM_USERS);
    setOrganizationId(null);
    setOrganizationName('DocuCrew Demonstração');
    setIsUsingSupabaseData(false);
    setDataLoadingState('SUCCESS');
    setDataError(null);
  }, [clearOperationalData]);

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

  // Main loader for Supabase data (strictly fail-closed: zero mocks upon error, timeout or missing org)
  const loadDataFromSupabase = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!isConfigured || !supabase || !user) {
      clearOperationalData();
      setDataLoadingState('IDLE');
      setDataError(null);
      return;
    }

    setDataLoadingState('LOADING');
    setDataError(null);

    try {
      // 1. Fetch Organization linked to user
      const orgResult = await fetchUserOrganization(supabase, user.id);

      if (orgResult.error) {
        clearOperationalData();
        setDataError(orgResult.error);
        setDataLoadingState('ERROR');
        return;
      }

      if (!orgResult.found || !orgResult.organizationId) {
        clearOperationalData();
        setDataLoadingState('ORG_NOT_FOUND');
        return;
      }

      setOrganizationId(orgResult.organizationId);
      setOrganizationName(orgResult.organizationName);

      // 2. Fetch Operational Database Tables for the organization
      const dashboardResult = await loadSupabaseDashboardData(
        supabase,
        orgResult.organizationId
      );

      if (!dashboardResult.success || !dashboardResult.data) {
        clearOperationalData();
        setOrganizationId(orgResult.organizationId);
        setOrganizationName(orgResult.organizationName);
        setDataError(dashboardResult.error || 'Não foi possível carregar os dados operacionais do Supabase.');
        setDataLoadingState('ERROR');
        return;
      }

      const {
        contractors: dbContractors,
        worksites: dbSites,
        workers: dbWorkers,
        documents: dbDocs,
        documentTypes: dbDocTypes,
        workerRoles: dbRoles,
        alerts: dbAlerts,
      } = dashboardResult.data;

      // Update state strictly with real Supabase data — NEVER fallback to INITIAL_*
      setContractors(dbContractors);
      setWorksites(dbSites);
      setWorkers(dbWorkers);
      setDocuments(dbDocs);
      setDocumentTypes(dbDocTypes);
      setWorkerRoles(dbRoles || []);
      setAlerts(dbAlerts || []);

      setIsUsingSupabaseData(true);

      if (dashboardResult.isEmpty) {
        setDataLoadingState('EMPTY');
      } else {
        setDataLoadingState('SUCCESS');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na conexão com o Supabase';
      console.warn('Erro ao carregar dados do Supabase:', msg);
      clearOperationalData();
      setDataError(msg);
      setDataLoadingState('ERROR');
    }
  }, [isConfigured, user, clearOperationalData]);

  // Synchronize data whenever user session or mode changes
  useEffect(() => {
    if (authMode === 'supabase') {
      if (user) {
        loadDataFromSupabase();
      } else {
        clearOperationalData();
        setDataLoadingState('IDLE');
        setDataError(null);
      }
    } else if (authMode === 'demo') {
      loadDemoData();
    } else {
      // config_error
      clearOperationalData();
      setDataLoadingState('ERROR');
      setDataError('SYSTEM_CONFIGURATION_ERROR: Supabase indisponível e modo demonstração desabilitado.');
    }
  }, [authMode, user, loadDataFromSupabase, loadDemoData, clearOperationalData]);


  const approveDocument = async (
    documentId: string,
    reviewedBy = 'Fiscal Roberto Farias (TST)'
  ): Promise<{ success: boolean; error?: string }> => {
    const targetDoc = documents.find((d) => d.id === documentId);
    const docName = targetDoc?.documentTypeName || 'Documento';
    const workerName = targetDoc?.workerName || 'Trabalhador';
    const affectedWorkerId = targetDoc?.workerId;

    const supabase = getSupabaseClient();
    if (isUsingSupabaseData && supabase) {
      const result = await updateDocumentStatus(
        supabase,
        documentId,
        'approved',
        `Aprovado por ${reviewedBy}`,
        undefined
      );
      if (!result.success) {
        showToast(
          'Erro ao Aprovar Documento',
          result.error || 'Falha ao persistir a aprovação no banco de dados.',
          'error'
        );
        return { success: false, error: result.error };
      }
    }

    setDocuments((prevDocs) => {
      const nextDocs = prevDocs.map((doc) => {
        if (doc.id === documentId) {
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

      const workerIdToRecalculate = affectedWorkerId || nextDocs.find((d) => d.id === documentId)?.workerId;
      if (workerIdToRecalculate) {
        setTimeout(() => recalculateWorkerState(workerIdToRecalculate, nextDocs), 0);
      }
      return nextDocs;
    });

    showToast(
      'Documento Aprovado com Sucesso',
      `O documento "${docName}" de ${workerName} foi validado e marcado como APROVADO.`,
      'success'
    );
    return { success: true };
  };

  const rejectDocument = async (
    documentId: string,
    reason: string,
    reviewedBy = 'Fiscal Roberto Farias (TST)'
  ): Promise<{ success: boolean; error?: string }> => {
    const targetDoc = documents.find((d) => d.id === documentId);
    const docName = targetDoc?.documentTypeName || 'Documento';
    const workerName = targetDoc?.workerName || 'Trabalhador';
    const affectedWorkerId = targetDoc?.workerId;

    const supabase = getSupabaseClient();
    if (isUsingSupabaseData && supabase) {
      const result = await updateDocumentStatus(
        supabase,
        documentId,
        'rejected',
        `Rejeitado por ${reviewedBy}: ${reason}`,
        reason
      );
      if (!result.success) {
        showToast(
          'Erro ao Recusar Documento',
          result.error || 'Falha ao persistir a recusa no banco de dados.',
          'error'
        );
        return { success: false, error: result.error };
      }
    }

    setDocuments((prevDocs) => {
      const nextDocs = prevDocs.map((doc) => {
        if (doc.id === documentId) {
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

      const workerIdToRecalculate = affectedWorkerId || nextDocs.find((d) => d.id === documentId)?.workerId;
      if (workerIdToRecalculate) {
        setTimeout(() => recalculateWorkerState(workerIdToRecalculate, nextDocs), 0);
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
      contractorName: targetDoc?.contractorName || 'Terceirizada',
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
    return { success: true };
  };

  const requestCorrection = async (
    documentId: string,
    notes: string,
    reviewedBy = 'Fiscal Roberto Farias (TST)'
  ): Promise<{ success: boolean; error?: string }> => {
    const targetDoc = documents.find((d) => d.id === documentId);
    const docName = targetDoc?.documentTypeName || 'Documento';
    const workerName = targetDoc?.workerName || 'Trabalhador';
    const affectedWorkerId = targetDoc?.workerId;

    const supabase = getSupabaseClient();
    if (isUsingSupabaseData && supabase) {
      const result = await updateDocumentStatus(
        supabase,
        documentId,
        'under_review',
        `Correção solicitada por ${reviewedBy}: ${notes}`,
        `Correção solicitada: ${notes}`
      );
      if (!result.success) {
        showToast(
          'Erro ao Solicitar Correção',
          result.error || 'Falha ao persistir a solicitação no banco de dados.',
          'error'
        );
        return { success: false, error: result.error };
      }
    }

    setDocuments((prevDocs) => {
      const nextDocs = prevDocs.map((doc) => {
        if (doc.id === documentId) {
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

      const workerIdToRecalculate = affectedWorkerId || nextDocs.find((d) => d.id === documentId)?.workerId;
      if (workerIdToRecalculate) {
        setTimeout(() => recalculateWorkerState(workerIdToRecalculate, nextDocs), 0);
      }
      return nextDocs;
    });

    showToast(
      'Solicitação de Correção Enviada',
      `Uma notificação de ajuste para "${docName}" de ${workerName} foi enviada para a prestadora.`,
      'warning'
    );
    return { success: true };
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

  // 1. Add Contractor
  const addContractor = async (payload: CreateContractorPayload): Promise<{ success: boolean; error?: string }> => {
    const supabase = getSupabaseClient();
    if (isUsingSupabaseData && organizationId && supabase) {
      const result = await createContractor(supabase, organizationId, payload);
      if (!result.success) {
        showToast('Erro ao cadastrar empresa', result.error || 'Falha ao salvar', 'error');
        return { success: false, error: result.error };
      }
      await loadDataFromSupabase();
      showToast('Empresa Cadastrada', `${payload.tradeName} adicionada com sucesso.`, 'success');
      return { success: true };
    }

    // Demo Mode fallback
    const contractorStatus: ContractorStatus =
      payload.status === 'CONFORME' || payload.status === 'active'
        ? 'CONFORME'
        : payload.status === 'BLOQUEADA' || payload.status === 'blocked'
        ? 'BLOQUEADA'
        : 'PARCIAL';

    const newContractor: Contractor = {
      id: `c-demo-${Date.now()}`,
      name: payload.name || payload.tradeName,
      tradeName: payload.tradeName,
      cnpj: payload.cnpj,
      cnpjMasked: payload.cnpj ? payload.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : '**.***.***/0001-**',
      responsibleName: payload.responsibleName || payload.contactName || '',
      responsibleEmail: payload.responsibleEmail || payload.contactEmail || '',
      responsiblePhone: payload.responsiblePhone || payload.contactPhone || '',
      status: contractorStatus,
      complianceRate: 50,
      totalWorkers: 0,
      activeWorkers: 0,
      blockedWorkers: 0,
      pendingDocumentsCount: 0,
      siteIds: [],
      corporateDocumentsCount: {
        valid: 0,
        pending: 0,
      },
    };
    setContractors((prev) => [newContractor, ...prev]);
    showToast('Empresa Cadastrada', `${payload.tradeName} cadastrada (Demonstração).`, 'success');
    return { success: true };
  };

  // 2. Add Worker
  const addWorker = async (payload: CreateWorkerPayload): Promise<{ success: boolean; workerCreated?: boolean; error?: string }> => {
    const supabase = getSupabaseClient();
    if (isUsingSupabaseData && organizationId && supabase) {
      const result = await createWorker(supabase, organizationId, payload);
      if (!result.success) {
        if (result.workerCreated) {
          // Worker created but site assignment failed
          await loadDataFromSupabase();
          showToast('Aviso de Cadastro', result.error || 'Trabalhador cadastrado, mas o vínculo com a obra falhou.', 'warning');
          return { success: false, workerCreated: true, error: result.error };
        }
        showToast('Erro ao cadastrar trabalhador', result.error || 'Falha ao salvar', 'error');
        return { success: false, error: result.error };
      }
      await loadDataFromSupabase();
      showToast('Trabalhador Cadastrado', `${payload.fullName || payload.name} cadastrado com status inicial BLOQUEADO.`, 'success');
      return { success: true };
    }

    // Demo Mode fallback
    const contractor = contractors.find((c) => c.id === payload.contractorId);
    const workerName = payload.fullName || payload.name || 'Novo Trabalhador';
    const cleanCpf = payload.cpf ? payload.cpf.replace(/\D/g, '') : '';
    const maskedCpf = cleanCpf.length === 11
      ? `${cleanCpf.slice(0, 3)}.${cleanCpf.slice(3, 6)}.${cleanCpf.slice(6, 9)}-${cleanCpf.slice(9, 11)}`
      : '000.***.***-00';
    const cpfLast4 = cleanCpf.length >= 4 ? cleanCpf.slice(-4) : (payload.cpfLast4 || '0000');
    const initials = workerName
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();

    const selectedRole = workerRoles.find((r) => r.id === (payload.workerRoleId || payload.roleId));
    const roleName = payload.role || selectedRole?.name || 'Operacional';

    const newWorker: Worker = {
      id: `w-demo-${Date.now()}`,
      name: workerName,
      cpf: payload.cpf,
      cpfMasked: maskedCpf,
      cpfLast4,
      role: roleName,
      workerRoleId: payload.workerRoleId || payload.roleId || 'role-1',
      employeeCode: payload.employeeCode || `OP-${Date.now().toString().slice(-6)}`,
      contractorId: payload.contractorId,
      contractorName: contractor?.tradeName || 'Terceirizada',
      siteIds: payload.siteId ? [payload.siteId] : [],
      status: 'BLOQUEADO',
      blockReason: payload.blockingReason || 'Documentação admissional pendente de envio e aprovação',
      approvedDocumentsCount: 0,
      underReviewDocumentsCount: 0,
      pendingDocumentsCount: 4,
      expiredDocumentsCount: 0,
      totalRequiredDocuments: 4,
      avatarInitials: initials || 'TR',
      admissionDate: payload.admissionDate || new Date().toISOString().split('T')[0],
      email: payload.email,
      phone: payload.phone,
    };
    setWorkers((prev) => [newWorker, ...prev]);
    showToast('Trabalhador Cadastrado', `${workerName} cadastrado com status inicial BLOQUEADO.`, 'success');
    return { success: true };
  };

  // 3. Add Site / Contract
  const addSite = async (payload: CreateSitePayload): Promise<{ success: boolean; error?: string }> => {
    const supabase = getSupabaseClient();
    if (isUsingSupabaseData && organizationId && supabase) {
      const result = await createSite(supabase, organizationId, payload);
      if (!result.success) {
        showToast('Erro ao cadastrar obra', result.error || 'Falha ao salvar', 'error');
        return { success: false, error: result.error };
      }
      await loadDataFromSupabase();
      showToast('Obra / Contrato Criado', `${payload.name} cadastrado com sucesso.`, 'success');
      return { success: true };
    }

    // Demo Mode fallback
    const newSite: WorkSite = {
      id: `s-demo-${Date.now()}`,
      code: payload.code.toUpperCase(),
      name: payload.name,
      clientName: payload.clientName,
      location: payload.location,
      startDate: payload.startDate,
      endDate: payload.endDate,
      totalWorkers: 0,
      releasedWorkers: 0,
      blockedWorkers: 0,
      complianceRate: 100,
      criticalPendingCount: 0,
      specificRequirements: ['ASO Admissional', 'NR-01 Ordem de Serviço'],
      contractorIds: [],
    };
    setWorksites((prev) => [newSite, ...prev]);
    showToast('Obra / Contrato Criado', `${payload.name} cadastrado (Demonstração).`, 'success');
    return { success: true };
  };

  // 4. Add Document Type
  const addDocumentType = async (payload: CreateDocumentTypePayload): Promise<{ success: boolean; error?: string }> => {
    const supabase = getSupabaseClient();
    if (isUsingSupabaseData && organizationId && supabase) {
      const result = await createDocumentType(supabase, organizationId, payload);
      if (!result.success) {
        showToast('Erro ao criar tipo de documento', result.error || 'Falha ao salvar', 'error');
        return { success: false, error: result.error };
      }
      await loadDataFromSupabase();
      showToast('Tipo de Documento Criado', `${payload.name} adicionado à matriz de requisitos.`, 'success');
      return { success: true };
    }

    // Demo Mode fallback
    const domainCategory: 'SEGURANCA' | 'SAUDE' | 'CLT' | 'QUALIFICACAO' | 'CORPORATIVO' =
      payload.category === 'safety' || payload.category === 'SEGURANCA'
        ? 'SEGURANCA'
        : payload.category === 'occupational_health' || payload.category === 'SAUDE'
        ? 'SAUDE'
        : payload.category === 'personal' || payload.category === 'CLT'
        ? 'CLT'
        : payload.category === 'training' || payload.category === 'certification' || payload.category === 'QUALIFICACAO'
        ? 'QUALIFICACAO'
        : 'CORPORATIVO';

    const newDocType: DocumentTypeDefinition = {
      id: `dt-demo-${Date.now()}`,
      code: payload.name.toUpperCase().replace(/\s+/g, '_'),
      name: payload.name,
      category: domainCategory,
      description: payload.description || '',
      validityMonths: payload.hasExpiration ? (payload.validityMonths || 12) : null,
      isActive: payload.isActive ?? true,
      isMandatory: payload.isMandatory,
      requiredForRoles: payload.roleId ? [payload.roleId] : ['*'],
    };
    setDocumentTypes((prev) => [...prev, newDocType]);
    showToast('Tipo de Documento Criado', `${payload.name} adicionado (Demonstração).`, 'success');
    return { success: true };
  };

  // 5. Edit Document Type
  const editDocumentType = async (docTypeId: string, payload: Partial<CreateDocumentTypePayload>): Promise<{ success: boolean; error?: string }> => {
    const supabase = getSupabaseClient();
    if (isUsingSupabaseData && organizationId && supabase) {
      const result = await updateDocumentType(supabase, organizationId, docTypeId, payload);
      if (!result.success) {
        showToast('Erro ao atualizar tipo', result.error || 'Falha ao atualizar', 'error');
        return { success: false, error: result.error };
      }
      await loadDataFromSupabase();
      showToast('Tipo de Documento Atualizado', 'Alterações gravadas com sucesso.', 'success');
      return { success: true };
    }

    // Demo Mode fallback
    setDocumentTypes((prev) =>
      prev.map((dt) => {
        if (dt.id === docTypeId) {
          return {
            ...dt,
            name: payload.name || dt.name,
            category: payload.category || dt.category,
            description: payload.description !== undefined ? payload.description : dt.description,
            validityDays: payload.hasExpiration !== undefined ? (payload.hasExpiration ? (payload.validityMonths || 12) * 30 : null) : dt.validityDays,
            isMandatory: payload.isMandatory !== undefined ? payload.isMandatory : dt.isMandatory,
            isActive: payload.isActive !== undefined ? payload.isActive : dt.isActive,
          };
        }
        return dt;
      })
    );
    showToast('Tipo de Documento Atualizado', 'Alterações salvas.', 'success');
    return { success: true };
  };

  // 6. Upload Worker Document
  const uploadDocument = async (file: File, payload: UploadWorkerDocumentPayload): Promise<{ success: boolean; error?: string }> => {
    const supabase = getSupabaseClient();
    if (isUsingSupabaseData && organizationId && supabase) {
      const result = await uploadWorkerDocument(supabase, organizationId, file, payload);
      if (!result.success) {
        showToast('Falha no Envio do Documento', result.error || 'Erro no processamento', 'error');
        return { success: false, error: result.error };
      }
      await loadDataFromSupabase();
      showToast('Documento Enviado', 'Arquivo recebido com sucesso e enviado para fila de análise.', 'success');
      return { success: true };
    }

    // Demo Mode fallback
    const worker = workers.find((w) => w.id === payload.workerId);
    const contractor = contractors.find((c) => c.id === payload.contractorId);
    const docType = documentTypes.find((dt) => dt.id === payload.documentTypeId);
    const site = worksites.find((s) => s.id === payload.siteId);

    const newDoc: WorkerDocument = {
      id: `doc-demo-${Date.now()}`,
      workerId: payload.workerId,
      workerName: worker?.name || 'Trabalhador',
      contractorId: payload.contractorId,
      contractorName: contractor?.tradeName || 'Terceirizada',
      siteId: payload.siteId || 'site-1',
      siteName: site?.name || 'Geral',
      documentTypeId: payload.documentTypeId,
      documentTypeName: docType?.name || 'Documento Anexado',
      category: docType?.category || 'SEGURANCA',
      status: 'AGUARDANDO_ANALISE',
      issueDate: payload.issueDate,
      expiryDate: payload.expiryDate || null,
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(0)} KB`,
      reviewedBy: undefined,
      reviewedAt: undefined,
    };

    setDocuments((prevDocs) => {
      const updated = [newDoc, ...prevDocs];
      recalculateWorkerState(payload.workerId, updated);
      return updated;
    });

    showToast('Documento Enviado', `${file.name} enviado para análise (Demonstração).`, 'success');
    return { success: true };
  };

  // 7. Download / Signed URL
  const downloadDocumentFile = async (filePath?: string): Promise<{ success: boolean; url?: string; error?: string }> => {
    if (!filePath) {
      return { success: false, error: 'Arquivo demonstrativo não disponível' };
    }
    const supabase = getSupabaseClient();
    if (isUsingSupabaseData && supabase) {
      return await getDocumentDownloadUrl(supabase, filePath);
    }
    return { success: false, error: 'Download disponível apenas para documentos reais anexados no Supabase Storage.' };
  };

  // 8. Update Organization Profile
  const updateOrgProfile = async (payload: { name: string; slug?: string }): Promise<{ success: boolean; error?: string }> => {
    const supabase = getSupabaseClient();
    if (isUsingSupabaseData && organizationId && supabase) {
      const result = await updateOrganizationProfile(supabase, organizationId, payload);
      if (!result.success) {
        showToast('Erro ao atualizar empresa', result.error || 'Falha ao salvar', 'error');
        return { success: false, error: result.error };
      }
      setOrganizationName(payload.name);
      showToast('Perfil Atualizado', 'Dados da empresa atualizados com sucesso.', 'success');
      return { success: true };
    }

    setOrganizationName(payload.name);
    showToast('Perfil Atualizado', 'Dados da organização alterados (Demonstração).', 'success');
    return { success: true };
  };

  // 9. Atomic Onboarding: Create First Organization via RPC public.create_first_organization
  const createCompanyOnboarding = async (
    name: string
  ): Promise<{ success: boolean; error?: string; alreadyHasOrg?: boolean }> => {
    const supabase = getSupabaseClient();
    if (!isConfigured || !supabase || !user) {
      return { success: false, error: 'Usuário não autenticado ou Supabase indisponível.' };
    }

    const result = await createFirstOrganization(supabase, name);

    if (result.success) {
      // Refresh organization & operational tables
      await loadDataFromSupabase();
      showToast('Empresa Criada', `O ambiente da empresa "${result.organizationName || name}" foi configurado com sucesso!`, 'success');
      return { success: true };
    }

    if (result.alreadyHasOrg) {
      // User already belongs to an organization in Postgres: load it immediately
      const orgCheck = await fetchUserOrganization(supabase, user.id);
      if (orgCheck.found && orgCheck.organizationId) {
        await loadDataFromSupabase();
        showToast('Empresa Localizada', `Seu vínculo com a organização "${orgCheck.organizationName}" foi carregado com sucesso.`, 'info');
        return { success: true, alreadyHasOrg: true };
      }
      return {
        success: false,
        alreadyHasOrg: true,
        error: 'Você já possui uma organização associada, mas houve uma falha ao localizá-la. Tente verificar novamente.',
      };
    }

    return {
      success: false,
      error: result.error || 'Não foi possível criar a empresa.',
    };
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
        workerRoles,
        users,
        organizationId,
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
        addContractor,
        addWorker,
        addSite,
        addDocumentType,
        editDocumentType,
        uploadDocument,
        downloadDocumentFile,
        updateOrgProfile,
        createCompanyOnboarding,
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
