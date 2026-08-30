export type DocumentStatus = 
  | 'APROVADO' 
  | 'AGUARDANDO_ANALISE' 
  | 'PROXIMO_VENCIMENTO' 
  | 'VENCIDO' 
  | 'RECUSADO' 
  | 'PENDENTE';

export type WorkerStatus = 'LIBERADO' | 'BLOQUEADO';

export type ContractorStatus = 'CONFORME' | 'PARCIAL' | 'BLOQUEADA';

export type AlertSeverity = 'CRITICA' | 'ATENCAO' | 'INFORMATIVA';

export interface WorkerRole {
  id: string;
  name: string;
  code?: string;
  description?: string;
}

export interface DocumentTypeDefinition {
  id: string;
  name: string;
  category: 'SEGURANCA' | 'SAUDE' | 'CLT' | 'QUALIFICACAO' | 'CORPORATIVO';
  validityMonths: number | null; // null = Não se aplica
  isMandatory: boolean;
  requiredForRoles: string[]; // Role IDs or '*'
  code?: string;
  description?: string;
  isActive?: boolean;
}

export interface WorkerDocument {
  id: string;
  workerId: string;
  workerName: string;
  contractorId: string;
  contractorName: string;
  siteId: string;
  siteName: string;
  documentTypeId: string;
  documentTypeName: string;
  category: 'SEGURANCA' | 'SAUDE' | 'CLT' | 'QUALIFICACAO' | 'CORPORATIVO';
  issueDate: string; // ISO YYYY-MM-DD
  expiryDate: string | null; // null = Não se aplica
  status: DocumentStatus;
  requirementId?: string | null;
  fileUrl?: string;
  filePath?: string;
  fileSize?: string;
  fileName?: string;
  rejectionReason?: string;
  correctionNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  issuerDetails?: {
    professionalName?: string;
    registryNumber?: string; // CRM, CREA, etc.
    trainingHours?: number;
  };
}

export interface Worker {
  id: string;
  name: string;
  cpfMasked: string; // e.g. ***.452.890-**
  cpf?: string;
  cpfLast4?: string;
  role: string;
  workerRoleId?: string;
  employeeCode?: string;
  contractorId: string;
  contractorName: string;
  siteIds: string[];
  status: WorkerStatus;
  blockReason?: string;
  pendingDocumentsCount: number;
  expiredDocumentsCount: number;
  underReviewDocumentsCount: number;
  approvedDocumentsCount: number;
  totalRequiredDocuments: number;
  avatarInitials: string;
  admissionDate: string;
  email?: string;
  phone?: string;
}

export interface Contractor {
  id: string;
  name: string;
  tradeName: string;
  cnpjMasked: string; // e.g. **.***.123/0001-**
  cnpj?: string;
  responsibleName: string;
  responsibleEmail: string;
  responsiblePhone: string;
  status: ContractorStatus;
  totalWorkers: number;
  activeWorkers: number;
  blockedWorkers: number;
  complianceRate: number; // 0 to 100
  pendingDocumentsCount: number;
  siteIds: string[];
  corporateDocumentsCount: {
    valid: number;
    pending: number;
  };
}

export interface WorkSite {
  id: string;
  name: string;
  code: string;
  clientName: string;
  location: string;
  startDate: string;
  endDate: string | 'Contínuo';
  contractorIds: string[];
  totalWorkers: number;
  releasedWorkers: number;
  blockedWorkers: number;
  complianceRate: number;
  criticalPendingCount: number;
  specificRequirements: string[];
  activeContractorsCount?: number;
}

export interface AlertNotification {
  id: string;
  severity: AlertSeverity;
  type: 'VENCIDO' | 'PROXIMO_VENCIMENTO' | 'DOCUMENTO_FALTANTE' | 'COBRANCA_ENVIADA';
  title: string;
  description: string;
  workerName?: string;
  contractorName: string;
  siteName?: string;
  documentName?: string;
  daysRemaining?: number; // negative if expired
  createdAt: string;
  isRead: boolean;
  actionRequired: string;
}

export interface NotificationHistoryLog {
  id: string;
  recipient: string;
  contractorName: string;
  channel: 'WHATSAPP' | 'EMAIL' | 'PORTAL';
  subject: string;
  sentAt: string;
  status: 'ENTREGUE' | 'LIDO' | 'ENVIADO';
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMINISTRADOR' | 'FISCAL_SEGURANCA' | 'ANALISTA_DOCUMENTAL' | 'AUDITOR';
  status: 'ATIVO' | 'INATIVO';
  lastAccess: string;
}
