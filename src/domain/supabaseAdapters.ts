import {
  Contractor,
  WorkSite,
  Worker,
  WorkerDocument,
  DocumentTypeDefinition,
  DocumentStatus,
  WorkerStatus,
  ContractorStatus,
  AlertNotification,
} from '../types';
import { evaluateWorkerCompliance } from './workerCompliance';

/**
 * Maps raw database document status (English snake_case, PT-BR, etc.) to DocumentStatus enum.
 */
export function mapDocumentStatus(rawStatus?: string | null): DocumentStatus {
  if (!rawStatus) return 'PENDENTE';
  const normalized = String(rawStatus).trim().toLowerCase();

  switch (normalized) {
    case 'approved':
    case 'aprovado':
    case 'valido':
    case 'valid':
      return 'APROVADO';
    case 'expiring':
    case 'proximo_vencimento':
    case 'a_vencer':
    case 'warning':
      return 'PROXIMO_VENCIMENTO';
    case 'expired':
    case 'vencido':
    case 'invalido':
      return 'VENCIDO';
    case 'rejected':
    case 'recusado':
    case 'reprovado':
      return 'RECUSADO';
    case 'under_review':
    case 'aguardando_analise':
    case 'em_analise':
    case 'review':
      return 'AGUARDANDO_ANALISE';
    case 'pending':
    case 'pendente':
    case 'nao_enviado':
    default:
      return 'PENDENTE';
  }
}

/**
 * Maps raw database worker status to WorkerStatus enum.
 */
export function mapWorkerStatus(rawStatus?: string | null): WorkerStatus {
  if (!rawStatus) return 'BLOQUEADO';
  const normalized = String(rawStatus).trim().toLowerCase();

  if (normalized === 'released' || normalized === 'liberado' || normalized === 'apto') {
    return 'LIBERADO';
  }
  return 'BLOQUEADO';
}

/**
 * Maps raw database contractor status to ContractorStatus enum.
 */
export function mapContractorStatus(rawStatus?: string | null): ContractorStatus {
  if (!rawStatus) return 'PARCIAL';
  const normalized = String(rawStatus).trim().toLowerCase();

  if (normalized === 'conforme' || normalized === 'compliant' || normalized === 'active') {
    return 'CONFORME';
  }
  if (normalized === 'bloqueada' || normalized === 'blocked' || normalized === 'inactive') {
    return 'BLOQUEADA';
  }
  return 'PARCIAL';
}

export interface DashboardIndicators {
  totalWorkers: number;
  releasedWorkers: number;
  blockedWorkers: number;
  expiredDocuments: number;
  expiringDocuments: number;
  underReviewDocuments: number;
  approvedDocuments: number;
  pendingDocuments: number;
  complianceRate: number;
}

/**
 * Calculates executive KPI metrics from worker and document lists.
 */
export function calculateIndicators(
  workers: Worker[],
  documents: WorkerDocument[]
): DashboardIndicators {
  const totalWorkers = workers.length;
  const releasedWorkers = workers.filter((w) => w.status === 'LIBERADO').length;
  const blockedWorkers = workers.filter((w) => w.status === 'BLOQUEADO').length;

  const expiredDocuments = documents.filter((d) => d.status === 'VENCIDO').length;
  const expiringDocuments = documents.filter((d) => d.status === 'PROXIMO_VENCIMENTO').length;
  const underReviewDocuments = documents.filter((d) => d.status === 'AGUARDANDO_ANALISE').length;
  const approvedDocuments = documents.filter((d) => d.status === 'APROVADO').length;
  const pendingDocuments = documents.filter((d) => d.status === 'PENDENTE').length;

  const complianceRate =
    totalWorkers > 0 ? Math.round((releasedWorkers / totalWorkers) * 100) : 100;

  return {
    totalWorkers,
    releasedWorkers,
    blockedWorkers,
    expiredDocuments,
    expiringDocuments,
    underReviewDocuments,
    approvedDocuments,
    pendingDocuments,
    complianceRate,
  };
}

/**
 * Helper to mask CPFs for privacy (e.g., ***.123.456-**).
 */
export function maskCpf(cpf?: string | null): string {
  if (!cpf) return '***.***.***-**';
  const clean = cpf.replace(/\D/g, '');
  if (clean.length === 11) {
    return `***.${clean.slice(3, 6)}.${clean.slice(6, 9)}-**`;
  }
  return '***.***.***-**';
}

/**
 * Helper to mask CNPJs for privacy (e.g., **.***.123/0001-**).
 */
export function maskCnpj(cnpj?: string | null): string {
  if (!cnpj) return '**.***.***/0001-**';
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length === 14) {
    return `**.***.${clean.slice(5, 8)}/${clean.slice(8, 12)}-**`;
  }
  return '**.***.***/0001-**';
}

/**
 * Helper to compute avatar initials from worker name.
 */
export function getAvatarInitials(name?: string | null): string {
  if (!name) return 'TR';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Raw DB record interfaces representing Supabase tables
 */
export interface RawContractor {
  id: string;
  name?: string;
  trade_name?: string;
  corporate_name?: string;
  cnpj?: string;
  contact_name?: string;
  responsible_name?: string;
  contact_email?: string;
  responsible_email?: string;
  contact_phone?: string;
  responsible_phone?: string;
  status?: string;
  [key: string]: unknown;
}

export interface RawSite {
  id: string;
  name?: string;
  code?: string;
  client_name?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  [key: string]: unknown;
}

export interface RawWorkerRole {
  id: string;
  name?: string;
  code?: string;
  description?: string;
  [key: string]: unknown;
}

export interface RawWorker {
  id: string;
  contractor_id?: string;
  name?: string;
  cpf?: string;
  role_id?: string;
  role?: string;
  status?: string;
  admission_date?: string;
  [key: string]: unknown;
}

export interface RawWorkerAssignment {
  id?: string;
  worker_id?: string;
  site_id?: string;
  status?: string;
  [key: string]: unknown;
}

export interface RawDocumentType {
  id: string;
  name?: string;
  category?: string;
  validity_months?: number | null;
  is_mandatory?: boolean;
  code?: string;
  [key: string]: unknown;
}

export interface RawDocumentRequirement {
  id?: string;
  document_type_id?: string;
  role_id?: string;
  site_id?: string;
  is_mandatory?: boolean;
  [key: string]: unknown;
}

export interface RawWorkerDocument {
  id: string;
  worker_id?: string;
  document_type_id?: string;
  site_id?: string;
  contractor_id?: string;
  status?: string;
  issue_date?: string;
  expiry_date?: string | null;
  file_url?: string;
  file_size?: string;
  file_name?: string;
  rejection_reason?: string;
  correction_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  [key: string]: unknown;
}

export interface AdaptedSupabaseData {
  contractors: Contractor[];
  worksites: WorkSite[];
  workers: Worker[];
  documents: WorkerDocument[];
  documentTypes: DocumentTypeDefinition[];
  alerts: AlertNotification[];
}

/**
 * Transforms raw Supabase table data into strongly typed DocuCrew domain entities.
 */
export function adaptSupabaseData(params: {
  rawContractors: RawContractor[];
  rawSites: RawSite[];
  rawRoles: RawWorkerRole[];
  rawWorkers: RawWorker[];
  rawAssignments: RawWorkerAssignment[];
  rawDocumentTypes: RawDocumentType[];
  rawRequirements: RawDocumentRequirement[];
  rawWorkerDocuments: RawWorkerDocument[];
}): AdaptedSupabaseData {
  const {
    rawContractors,
    rawSites,
    rawRoles,
    rawWorkers,
    rawAssignments,
    rawDocumentTypes,
    rawRequirements,
    rawWorkerDocuments,
  } = params;

  // 1. Map Document Types
  const documentTypesMap = new Map<string, DocumentTypeDefinition>();
  const documentTypes: DocumentTypeDefinition[] = rawDocumentTypes.map((rawDocType) => {
    const rawCategory = String(rawDocType.category || 'SEGURANCA').toUpperCase();
    const category = (['SEGURANCA', 'SAUDE', 'CLT', 'QUALIFICACAO', 'CORPORATIVO'].includes(rawCategory)
      ? rawCategory
      : 'SEGURANCA') as DocumentTypeDefinition['category'];

    const matchingReqs = rawRequirements.filter(
      (r) => r.document_type_id === rawDocType.id
    );
    const requiredForRoles = matchingReqs.map((r) => r.role_id || '*');

    const mapped: DocumentTypeDefinition = {
      id: String(rawDocType.id),
      name: String(rawDocType.name || 'Documento Técnico'),
      category,
      validityMonths: rawDocType.validity_months ?? null,
      isMandatory: rawDocType.is_mandatory ?? true,
      requiredForRoles: requiredForRoles.length > 0 ? requiredForRoles : ['*'],
    };
    documentTypesMap.set(mapped.id, mapped);
    return mapped;
  });

  // 2. Map Roles Map
  const rolesMap = new Map<string, string>();
  rawRoles.forEach((r) => {
    rolesMap.set(String(r.id), String(r.name || 'Trabalhador Operacional'));
  });

  // 3. Map Contractors Map & Setup
  const contractorNameMap = new Map<string, { name: string; tradeName: string }>();
  rawContractors.forEach((c) => {
    const name = String(c.corporate_name || c.name || 'Terceirizada Prestadora');
    const tradeName = String(c.trade_name || c.name || name);
    contractorNameMap.set(String(c.id), { name, tradeName });
  });

  // 4. Map Sites Map & Setup
  const siteNameMap = new Map<string, { name: string; code: string; clientName: string }>();
  rawSites.forEach((s) => {
    const name = String(s.name || 'Obra / Contrato');
    const code = String(s.code || `OB-${String(s.id).slice(0, 4).toUpperCase()}`);
    const clientName = String(s.client_name || 'Cliente Contratante');
    siteNameMap.set(String(s.id), { name, code, clientName });
  });

  // 5. Build assignments lookup
  const workerSiteIdsMap = new Map<string, Set<string>>();
  rawAssignments.forEach((a) => {
    if (a.worker_id && a.site_id) {
      const wId = String(a.worker_id);
      const sId = String(a.site_id);
      if (!workerSiteIdsMap.has(wId)) {
        workerSiteIdsMap.set(wId, new Set());
      }
      workerSiteIdsMap.get(wId)!.add(sId);
    }
  });

  // 6. Map Documents
  const rawDocsByWorker = new Map<string, WorkerDocument[]>();
  const documents: WorkerDocument[] = rawWorkerDocuments.map((rawDoc) => {
    const docTypeId = String(rawDoc.document_type_id || '');
    const docTypeDef = documentTypesMap.get(docTypeId);
    const workerId = String(rawDoc.worker_id || '');
    const contractorId = String(rawDoc.contractor_id || '');
    const siteId = String(rawDoc.site_id || '');

    const contractorInfo = contractorNameMap.get(contractorId);
    const siteInfo = siteNameMap.get(siteId);

    const mappedStatus = mapDocumentStatus(rawDoc.status);
    const docName = docTypeDef?.name || 'Documento Técnico';

    const mappedDoc: WorkerDocument = {
      id: String(rawDoc.id),
      workerId,
      workerName: '', // will backfill after workers map
      contractorId,
      contractorName: contractorInfo?.tradeName || 'Terceirizada',
      siteId,
      siteName: siteInfo?.name || 'Obra Geral',
      documentTypeId: docTypeId,
      documentTypeName: docName,
      category: docTypeDef?.category || 'SEGURANCA',
      issueDate: String(rawDoc.issue_date || new Date().toISOString().split('T')[0]),
      expiryDate: rawDoc.expiry_date ? String(rawDoc.expiry_date) : null,
      status: mappedStatus,
      fileUrl: rawDoc.file_url ? String(rawDoc.file_url) : undefined,
      fileSize: rawDoc.file_size ? String(rawDoc.file_size) : undefined,
      fileName: rawDoc.file_name ? String(rawDoc.file_name) : `${docName.replace(/\s+/g, '_')}.pdf`,
      rejectionReason: rawDoc.rejection_reason ? String(rawDoc.rejection_reason) : undefined,
      correctionNotes: rawDoc.correction_notes ? String(rawDoc.correction_notes) : undefined,
      reviewedBy: rawDoc.reviewed_by ? String(rawDoc.reviewed_by) : undefined,
      reviewedAt: rawDoc.reviewed_at ? String(rawDoc.reviewed_at) : undefined,
    };

    if (!rawDocsByWorker.has(workerId)) {
      rawDocsByWorker.set(workerId, []);
    }
    rawDocsByWorker.get(workerId)!.push(mappedDoc);

    return mappedDoc;
  });

  // 7. Map Workers & evaluate compliance using evaluateWorkerCompliance
  const workers: Worker[] = rawWorkers.map((rawWorker) => {
    const workerId = String(rawWorker.id);
    const contractorId = String(rawWorker.contractor_id || '');
    const contractorInfo = contractorNameMap.get(contractorId);
    const roleId = String(rawWorker.role_id || '');
    const roleName = String(rawWorker.role || rolesMap.get(roleId) || 'Trabalhador Operacional');
    const workerName = String(rawWorker.name || 'Trabalhador');

    const assignedSites = Array.from(workerSiteIdsMap.get(workerId) || []);
    const siteIds = assignedSites.length > 0 ? assignedSites : rawSites.length > 0 ? [String(rawSites[0].id)] : [];

    // Calculate total required documents based on requirements or document types
    const roleSpecificMandatoryDocs = documentTypes.filter((dt) => {
      if (!dt.isMandatory) return false;
      if (dt.requiredForRoles.includes('*')) return true;
      return dt.requiredForRoles.includes(roleId) || dt.requiredForRoles.includes(roleName);
    });

    const totalRequiredDocuments =
      roleSpecificMandatoryDocs.length > 0
        ? roleSpecificMandatoryDocs.length
        : Math.max(1, documentTypes.filter((d) => d.isMandatory).length);

    // Get documents of this worker
    const workerDocs = rawDocsByWorker.get(workerId) || [];

    // Run official evaluateWorkerCompliance domain logic
    const compliance = evaluateWorkerCompliance(workerDocs, totalRequiredDocuments);

    const workerObj: Worker = {
      id: workerId,
      name: workerName,
      cpfMasked: maskCpf(rawWorker.cpf ? String(rawWorker.cpf) : null),
      role: roleName,
      contractorId,
      contractorName: contractorInfo?.tradeName || 'Terceirizada',
      siteIds,
      status: compliance.status,
      blockReason: compliance.blockReason,
      pendingDocumentsCount: compliance.pendingDocumentsCount,
      expiredDocumentsCount: compliance.expiredDocumentsCount,
      underReviewDocumentsCount: compliance.underReviewDocumentsCount,
      approvedDocumentsCount: compliance.approvedDocumentsCount,
      totalRequiredDocuments,
      avatarInitials: getAvatarInitials(workerName),
      admissionDate: String(rawWorker.admission_date || '2025-01-15'),
    };

    return workerObj;
  });

  // Backfill worker names in documents
  const workerNamesMap = new Map<string, string>();
  workers.forEach((w) => workerNamesMap.set(w.id, w.name));
  documents.forEach((d) => {
    if (workerNamesMap.has(d.workerId)) {
      d.workerName = workerNamesMap.get(d.workerId)!;
    }
  });

  // 8. Map Contractors with real aggregated metrics
  const contractors: Contractor[] = rawContractors.map((rawCont) => {
    const cId = String(rawCont.id);
    const contWorkers = workers.filter((w) => w.contractorId === cId);
    const totalWorkers = contWorkers.length;
    const activeWorkers = contWorkers.filter((w) => w.status === 'LIBERADO').length;
    const blockedWorkers = contWorkers.filter((w) => w.status === 'BLOQUEADO').length;
    const complianceRate = totalWorkers > 0 ? Math.round((activeWorkers / totalWorkers) * 100) : 100;

    const contDocs = documents.filter((d) => d.contractorId === cId);
    const pendingDocumentsCount = contDocs.filter((d) => d.status === 'PENDENTE' || d.status === 'VENCIDO').length;

    // Unique sites this contractor is in
    const siteIds = Array.from(new Set(contWorkers.flatMap((w) => w.siteIds)));

    let status: ContractorStatus = 'CONFORME';
    if (blockedWorkers > 0 && activeWorkers === 0) {
      status = 'BLOQUEADA';
    } else if (blockedWorkers > 0) {
      status = 'PARCIAL';
    }

    const name = String(rawCont.corporate_name || rawCont.name || 'Terceirizada Prestadora');
    const tradeName = String(rawCont.trade_name || rawCont.name || name);

    return {
      id: cId,
      name,
      tradeName,
      cnpjMasked: maskCnpj(rawCont.cnpj ? String(rawCont.cnpj) : null),
      responsibleName: String(rawCont.responsible_name || rawCont.contact_name || 'Gestor Responsável'),
      responsibleEmail: String(rawCont.responsible_email || rawCont.contact_email || 'contato@terceirizada.com.br'),
      responsiblePhone: String(rawCont.responsible_phone || rawCont.contact_phone || '(11) 98765-4321'),
      status,
      totalWorkers,
      activeWorkers,
      blockedWorkers,
      complianceRate,
      pendingDocumentsCount,
      siteIds: siteIds.length > 0 ? siteIds : rawSites.map((s) => String(s.id)),
      corporateDocumentsCount: {
        valid: Math.max(1, documentTypes.filter((d) => d.category === 'CORPORATIVO').length),
        pending: 0,
      },
    };
  });

  // 9. Map WorkSites with real aggregated metrics
  const worksites: WorkSite[] = rawSites.map((rawSite) => {
    const sId = String(rawSite.id);
    const siteWorkers = workers.filter((w) => w.siteIds.includes(sId));
    const totalWorkers = siteWorkers.length;
    const releasedWorkers = siteWorkers.filter((w) => w.status === 'LIBERADO').length;
    const blockedWorkers = siteWorkers.filter((w) => w.status === 'BLOQUEADO').length;
    const complianceRate = totalWorkers > 0 ? Math.round((releasedWorkers / totalWorkers) * 100) : 100;

    const siteContractorIds = Array.from(new Set(siteWorkers.map((w) => w.contractorId)));
    const siteDocs = documents.filter((d) => d.siteId === sId);
    const criticalPendingCount = siteDocs.filter((d) => d.status === 'VENCIDO' || d.status === 'RECUSADO').length;

    return {
      id: sId,
      name: String(rawSite.name || 'Obra / Contrato'),
      code: String(rawSite.code || `OB-${sId.slice(0, 4).toUpperCase()}`),
      clientName: String(rawSite.client_name || 'Cliente Contratante'),
      location: String(rawSite.location || 'São Paulo - SP'),
      startDate: String(rawSite.start_date || '2025-01-01'),
      endDate: rawSite.end_date ? String(rawSite.end_date) : 'Contínuo',
      contractorIds: siteContractorIds.length > 0 ? siteContractorIds : rawContractors.map((c) => String(c.id)),
      totalWorkers,
      releasedWorkers,
      blockedWorkers,
      complianceRate,
      criticalPendingCount,
      specificRequirements: ['NR-18', 'NR-35', 'ASO Periódico'],
    };
  });

  // 10. Generate alerts from real blocked workers & documents
  const alerts: AlertNotification[] = [];

  // Add expired doc alerts
  documents
    .filter((d) => d.status === 'VENCIDO')
    .slice(0, 5)
    .forEach((d, idx) => {
      alerts.push({
        id: `alert-exp-${d.id || idx}`,
        severity: 'CRITICA',
        type: 'VENCIDO',
        title: `Documento Vencido: ${d.documentTypeName}`,
        description: `${d.workerName} da empresa ${d.contractorName} está com ${d.documentTypeName} vencido. Acesso bloqueado.`,
        workerName: d.workerName,
        contractorName: d.contractorName,
        siteName: d.siteName,
        documentName: d.documentTypeName,
        daysRemaining: -3,
        createdAt: 'Hoje',
        isRead: false,
        actionRequired: 'Solicitar envio urgente de novo documento.',
      });
    });

  // Add expiring doc alerts
  documents
    .filter((d) => d.status === 'PROXIMO_VENCIMENTO')
    .slice(0, 5)
    .forEach((d, idx) => {
      alerts.push({
        id: `alert-warn-${d.id || idx}`,
        severity: 'ATENCAO',
        type: 'PROXIMO_VENCIMENTO',
        title: `Vencimento Próximo: ${d.documentTypeName}`,
        description: `${d.documentTypeName} de ${d.workerName} (${d.contractorName}) vence em breve. Notifique a prestadora.`,
        workerName: d.workerName,
        contractorName: d.contractorName,
        siteName: d.siteName,
        documentName: d.documentTypeName,
        daysRemaining: 15,
        createdAt: 'Ontem',
        isRead: false,
        actionRequired: 'Emitir aviso prévio de renovação.',
      });
    });

  // Add rejected doc alerts
  documents
    .filter((d) => d.status === 'RECUSADO')
    .slice(0, 5)
    .forEach((d, idx) => {
      alerts.push({
        id: `alert-rec-${d.id || idx}`,
        severity: 'CRITICA',
        type: 'DOCUMENTO_FALTANTE',
        title: `Documento Recusado: ${d.documentTypeName}`,
        description: `O documento de ${d.workerName} foi recusado. Motivo: ${d.rejectionReason || 'Inconformidade técnica'}.`,
        workerName: d.workerName,
        contractorName: d.contractorName,
        siteName: d.siteName,
        documentName: d.documentTypeName,
        createdAt: 'Hoje',
        isRead: false,
        actionRequired: 'Aguardar reenvio de correção.',
      });
    });

  return {
    contractors,
    worksites,
    workers,
    documents,
    documentTypes,
    alerts,
  };
}
