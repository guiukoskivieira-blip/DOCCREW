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
  WorkerRole,
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

  if (normalized === 'released' || normalized === 'liberado' || normalized === 'apto' || normalized === 'active') {
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
    totalWorkers > 0 ? Math.round((releasedWorkers / totalWorkers) * 100) : 0;

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
 * Helper to mask CPFs for privacy (e.g., ***.***.***-1234 or ***.123.456-**).
 */
export function maskCpf(cpf?: string | null): string {
  if (!cpf) return '***.***.***-**';
  const clean = cpf.replace(/\D/g, '');
  if (clean.length === 11) {
    return `***.${clean.slice(3, 6)}.${clean.slice(6, 9)}-**`;
  }
  if (clean.length === 4) {
    return `***.***.***-${clean}`;
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
  organization_id?: string;
  legal_name?: string;
  trade_name?: string;
  tax_id_masked?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  status?: string;
  // Legacy / fallback fields
  name?: string;
  corporate_name?: string;
  cnpj?: string;
  responsible_name?: string;
  responsible_email?: string;
  responsible_phone?: string;
  [key: string]: unknown;
}

export interface RawSite {
  id: string;
  organization_id?: string;
  code?: string;
  name?: string;
  client_name?: string;
  location?: string;
  starts_on?: string;
  ends_on?: string | null;
  status?: string;
  // Legacy / fallback fields
  start_date?: string;
  end_date?: string;
  [key: string]: unknown;
}

export interface RawWorkerRole {
  id: string;
  organization_id?: string;
  name?: string;
  code?: string;
  description?: string;
  [key: string]: unknown;
}

export interface RawWorker {
  id: string;
  organization_id?: string;
  contractor_id?: string;
  worker_role_id?: string;
  full_name?: string;
  employee_code?: string;
  cpf_last4?: string;
  email?: string;
  phone?: string;
  status?: string;
  blocking_reason?: string;
  // Legacy / fallback fields
  name?: string;
  cpf?: string;
  role_id?: string;
  role?: string;
  admission_date?: string;
  [key: string]: unknown;
}

export interface RawWorkerAssignment {
  id?: string;
  organization_id?: string;
  worker_id?: string;
  site_id?: string;
  starts_on?: string;
  ends_on?: string | null;
  active?: boolean;
  status?: string;
  [key: string]: unknown;
}

export interface RawDocumentType {
  id: string;
  organization_id?: string;
  name?: string;
  category?: string;
  description?: string;
  has_expiration?: boolean;
  warning_days?: number | null;
  active?: boolean;
  // Legacy / fallback fields
  validity_months?: number | null;
  is_mandatory?: boolean;
  code?: string;
  [key: string]: unknown;
}

export interface RawDocumentRequirement {
  id?: string;
  organization_id?: string;
  document_type_id?: string;
  worker_role_id?: string | null;
  contractor_id?: string | null;
  site_id?: string | null;
  required?: boolean;
  warning_days?: number | null;
  active?: boolean;
  // Legacy / fallback fields
  role_id?: string;
  is_mandatory?: boolean;
  [key: string]: unknown;
}

export interface RawWorkerDocument {
  id: string;
  organization_id?: string;
  worker_id?: string;
  document_type_id?: string;
  requirement_id?: string | null;
  file_path?: string;
  original_file_name?: string;
  mime_type?: string;
  file_size_bytes?: number;
  issued_on?: string;
  expires_on?: string | null;
  status?: string;
  uploaded_by?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  // Legacy / fallback fields
  site_id?: string;
  contractor_id?: string;
  issue_date?: string;
  expiry_date?: string | null;
  file_url?: string;
  file_size?: string;
  file_name?: string;
  correction_notes?: string;
  [key: string]: unknown;
}

export interface AdaptedSupabaseData {
  contractors: Contractor[];
  worksites: WorkSite[];
  workers: Worker[];
  documents: WorkerDocument[];
  documentTypes: DocumentTypeDefinition[];
  workerRoles: WorkerRole[];
  alerts: AlertNotification[];
}

/**
 * Normalizes document type category from DB format (e.g. personal, occupational_health, training, safety, other)
 * to domain category (SEGURANCA, SAUDE, CLT, QUALIFICACAO, CORPORATIVO).
 */
export function normalizeDocumentCategory(rawCat?: string | null): DocumentTypeDefinition['category'] {
  if (!rawCat) return 'SEGURANCA';
  const c = rawCat.toLowerCase().trim();

  if (c === 'occupational_health' || c === 'saude' || c === 'saúde') return 'SAUDE';
  if (c === 'personal' || c === 'clt' || c === 'trabalhista') return 'CLT';
  if (c === 'training' || c === 'certification' || c === 'qualificacao' || c === 'qualificação') return 'QUALIFICACAO';
  if (c === 'other' || c === 'corporativo' || c === 'corporate') return 'CORPORATIVO';
  if (c === 'safety' || c === 'seguranca' || c === 'segurança') return 'SEGURANCA';

  const up = rawCat.toUpperCase().trim();
  if (['SEGURANCA', 'SAUDE', 'CLT', 'QUALIFICACAO', 'CORPORATIVO'].includes(up)) {
    return up as DocumentTypeDefinition['category'];
  }
  return 'SEGURANCA';
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

  // 1. Map Worker Roles
  const workerRoles: WorkerRole[] = rawRoles.map((r) => ({
    id: String(r.id),
    name: String(r.name || 'Função Operacional'),
    code: r.code ? String(r.code) : undefined,
    description: r.description ? String(r.description) : undefined,
  }));

  const rolesMap = new Map<string, string>();
  workerRoles.forEach((r) => {
    rolesMap.set(r.id, r.name);
  });

  // 2. Map Document Types
  const documentTypesMap = new Map<string, DocumentTypeDefinition>();
  const documentTypes: DocumentTypeDefinition[] = rawDocumentTypes.map((rawDocType) => {
    const category = normalizeDocumentCategory(rawDocType.category);

    const matchingReqs = rawRequirements.filter(
      (r) => r.document_type_id === rawDocType.id && r.active !== false
    );
    const requiredForRoles = matchingReqs
      .map((r) => r.worker_role_id || r.role_id)
      .filter((roleId): roleId is string => Boolean(roleId));

    const isMandatory =
      matchingReqs.length > 0
        ? matchingReqs.some((r) => r.required !== false && r.is_mandatory !== false)
        : (rawDocType.is_mandatory ?? true);

    const hasExpiration = rawDocType.has_expiration ?? true;
    const validityMonths = hasExpiration ? (rawDocType.validity_months ?? 12) : null;

    const mapped: DocumentTypeDefinition = {
      id: String(rawDocType.id),
      name: String(rawDocType.name || 'Documento Técnico'),
      category,
      validityMonths,
      isMandatory,
      requiredForRoles: requiredForRoles.length > 0 ? requiredForRoles : ['*'],
      description: rawDocType.description ? String(rawDocType.description) : undefined,
      isActive: rawDocType.active ?? true,
    };
    documentTypesMap.set(mapped.id, mapped);
    return mapped;
  });

  // 3. Map Contractors Map & Setup
  const contractorNameMap = new Map<string, { name: string; tradeName: string }>();
  rawContractors.forEach((c) => {
    const legalName = String(c.legal_name || c.corporate_name || c.name || 'Terceirizada Prestadora');
    const tradeName = String(c.trade_name || c.name || legalName);
    contractorNameMap.set(String(c.id), { name: legalName, tradeName });
  });

  // 4. Map Sites Map & Setup
  const siteNameMap = new Map<string, { name: string; code: string; clientName: string }>();
  rawSites.forEach((s) => {
    const name = String(s.name || 'Obra / Contrato');
    const code = String(s.code || `OB-${String(s.id).slice(0, 4).toUpperCase()}`);
    const clientName = String(s.client_name || 'Cliente Contratante');
    siteNameMap.set(String(s.id), { name, code, clientName });
  });

  // 5. Build assignments lookup (filter active assignments)
  const workerSiteIdsMap = new Map<string, Set<string>>();
  rawAssignments
    .filter((a) => a.active !== false)
    .forEach((a) => {
      if (a.worker_id && a.site_id) {
        const wId = String(a.worker_id);
        const sId = String(a.site_id);
        if (!workerSiteIdsMap.has(wId)) {
          workerSiteIdsMap.set(wId, new Set());
        }
        workerSiteIdsMap.get(wId)!.add(sId);
      }
    });

  // Map worker contractor lookup
  const workerContractorIdMap = new Map<string, string>();
  rawWorkers.forEach((w) => {
    if (w.id && w.contractor_id) {
      workerContractorIdMap.set(String(w.id), String(w.contractor_id));
    }
  });

  // 6. Map Documents
  const rawDocsByWorker = new Map<string, WorkerDocument[]>();
  const documents: WorkerDocument[] = rawWorkerDocuments.map((rawDoc) => {
    const docTypeId = String(rawDoc.document_type_id || '');
    const docTypeDef = documentTypesMap.get(docTypeId);
    const workerId = String(rawDoc.worker_id || '');
    const contractorId = String(
      rawDoc.contractor_id || workerContractorIdMap.get(workerId) || ''
    );
    const workerAssignedSites = workerSiteIdsMap.get(workerId);
    const siteId = String(
      rawDoc.site_id || (workerAssignedSites && workerAssignedSites.size > 0 ? Array.from(workerAssignedSites)[0] : '')
    );

    const contractorInfo = contractorNameMap.get(contractorId);
    const siteInfo = siteNameMap.get(siteId);

    const mappedStatus = mapDocumentStatus(rawDoc.status);
    const docName = docTypeDef?.name || 'Documento Técnico';

    const fileSizeFormatted = rawDoc.file_size_bytes
      ? `${Math.round(Number(rawDoc.file_size_bytes) / 1024)} KB`
      : rawDoc.file_size
      ? String(rawDoc.file_size)
      : undefined;

    const fileNameFormatted =
      rawDoc.original_file_name ||
      rawDoc.file_name ||
      (rawDoc.file_path ? rawDoc.file_path.split('/').pop() : undefined) ||
      `${docName.replace(/\s+/g, '_')}.pdf`;

    const mappedDoc: WorkerDocument = {
      id: String(rawDoc.id),
      workerId,
      workerName: '', // backfilled after workers map
      contractorId,
      contractorName: contractorInfo?.tradeName || 'Terceirizada',
      siteId,
      siteName: siteInfo?.name || 'Canteiro Geral',
      documentTypeId: docTypeId,
      documentTypeName: docName,
      category: docTypeDef?.category || 'SEGURANCA',
      issueDate: String(rawDoc.issued_on || rawDoc.issue_date || new Date().toISOString().split('T')[0]),
      expiryDate: rawDoc.expires_on ? String(rawDoc.expires_on) : (rawDoc.expiry_date ? String(rawDoc.expiry_date) : null),
      status: mappedStatus,
      requirementId: rawDoc.requirement_id ? String(rawDoc.requirement_id) : undefined,
      filePath: rawDoc.file_path ? String(rawDoc.file_path) : undefined,
      fileUrl: rawDoc.file_url ? String(rawDoc.file_url) : undefined,
      fileSize: fileSizeFormatted,
      fileName: fileNameFormatted,
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
    const roleId = String(rawWorker.worker_role_id || rawWorker.role_id || '');
    const roleName = String(rawWorker.role || rolesMap.get(roleId) || 'Trabalhador Operacional');
    // Ensure real full_name is prioritized so actual worker names appear
    const workerName = String(rawWorker.full_name || rawWorker.name || 'Trabalhador');

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

    // CPF masking: prioritize cpf_last4 if present
    const cpfMasked = rawWorker.cpf_last4
      ? `***.***.***-${rawWorker.cpf_last4}`
      : (rawWorker.cpf ? maskCpf(String(rawWorker.cpf)) : '***.***.***-**');

    const workerObj: Worker = {
      id: workerId,
      name: workerName,
      cpfMasked,
      cpfLast4: rawWorker.cpf_last4 ? String(rawWorker.cpf_last4) : undefined,
      role: roleName,
      workerRoleId: roleId || undefined,
      employeeCode: rawWorker.employee_code ? String(rawWorker.employee_code) : undefined,
      contractorId,
      contractorName: contractorInfo?.tradeName || 'Terceirizada',
      siteIds,
      status: compliance.status,
      blockReason: compliance.blockReason || (rawWorker.blocking_reason ? String(rawWorker.blocking_reason) : undefined),
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

    const legalName = String(rawCont.legal_name || rawCont.corporate_name || rawCont.name || 'Terceirizada Prestadora');
    const tradeName = String(rawCont.trade_name || rawCont.name || legalName);
    const cnpjMasked = rawCont.tax_id_masked
      ? String(rawCont.tax_id_masked)
      : (rawCont.cnpj ? maskCnpj(String(rawCont.cnpj)) : '**.***.***/0001-**');

    return {
      id: cId,
      name: legalName,
      tradeName,
      cnpjMasked,
      responsibleName: String(rawCont.contact_name || rawCont.responsible_name || 'Gestor Responsável'),
      responsibleEmail: String(rawCont.contact_email || rawCont.responsible_email || 'contato@terceirizada.com.br'),
      responsiblePhone: String(rawCont.contact_phone || rawCont.responsible_phone || '(11) 98765-4321'),
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

    const startDate = String(rawSite.starts_on || rawSite.start_date || '2025-01-01');
    const endDate = rawSite.ends_on ? String(rawSite.ends_on) : (rawSite.end_date ? String(rawSite.end_date) : 'Contínuo');

    return {
      id: sId,
      name: String(rawSite.name || 'Obra / Contrato'),
      code: String(rawSite.code || `OB-${sId.slice(0, 4).toUpperCase()}`),
      clientName: String(rawSite.client_name || 'Cliente Contratante'),
      location: String(rawSite.location || 'São Paulo - SP'),
      startDate,
      endDate,
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
    workerRoles,
    alerts,
  };
}
