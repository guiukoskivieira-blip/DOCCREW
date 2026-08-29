import { DocumentStatus, WorkerStatus } from '../types';

export interface DocumentLike {
  id?: string;
  documentTypeName?: string;
  status: DocumentStatus;
  rejectionReason?: string;
}

export interface WorkerComplianceResult {
  status: WorkerStatus;
  blockReason?: string;
  approvedDocumentsCount: number;
  pendingDocumentsCount: number;
  expiredDocumentsCount: number;
  underReviewDocumentsCount: number;
}

/**
 * Avalia a conformidade documental de um trabalhador com base nas regras estritas de segurança:
 * 
 * Um trabalhador somente fica LIBERADO quando:
 * 1. Todos os documentos obrigatórios estiverem presentes (documentos >= totalRequiredDocuments e totalRequiredDocuments > 0);
 * 2. Todos estiverem com status APROVADO ou PROXIMO_VENCIMENTO;
 * 3. Não existir documento vencido (VENCIDO);
 * 4. Não existir documento recusado (RECUSADO);
 * 5. Não existir documento pendente (PENDENTE);
 * 6. Não existir documento aguardando análise (AGUARDANDO_ANALISE).
 * 
 * Caso contrário, o trabalhador é BLOQUEADO com o motivo de maior prioridade:
 * Prioridade 1: Documento vencido
 * Prioridade 2: Documento recusado
 * Prioridade 3: Documento obrigatório ausente
 * Prioridade 4: Documento pendente de envio
 * Prioridade 5: Documento aguardando análise
 */
export function evaluateWorkerCompliance(
  workerDocuments: DocumentLike[],
  totalRequiredDocuments: number
): WorkerComplianceResult {
  const docs = workerDocuments || [];
  
  const expiredDocs = docs.filter((d) => d.status === 'VENCIDO');
  const rejectedDocs = docs.filter((d) => d.status === 'RECUSADO');
  const pendingDocs = docs.filter((d) => d.status === 'PENDENTE');
  const underReviewDocs = docs.filter((d) => d.status === 'AGUARDANDO_ANALISE');
  const approvedDocs = docs.filter(
    (d) => d.status === 'APROVADO' || d.status === 'PROXIMO_VENCIMENTO'
  );

  const expiredCount = expiredDocs.length;
  const rejectedCount = rejectedDocs.length;
  const pendingCount = pendingDocs.length;
  const underReviewCount = underReviewDocs.length;
  const approvedCount = approvedDocs.length;

  const totalRequired = Math.max(0, totalRequiredDocuments || 0);
  const isMissingMandatory = totalRequired > 0 && docs.length < totalRequired;
  const missingCount = Math.max(0, totalRequired - docs.length);

  let status: WorkerStatus = 'LIBERADO';
  let blockReason: string | undefined = undefined;

  // Hierarquia estrita de motivos de bloqueio por prioridade
  if (expiredCount > 0) {
    status = 'BLOQUEADO';
    const firstExpired = expiredDocs[0];
    blockReason = `Documento vencido: ${firstExpired.documentTypeName || 'Documento obrigatório'}`;
  } else if (rejectedCount > 0) {
    status = 'BLOQUEADO';
    const firstRejected = rejectedDocs[0];
    const reasonDetail = firstRejected.rejectionReason
      ? ` (${firstRejected.rejectionReason})`
      : '';
    blockReason = `Documento recusado: ${firstRejected.documentTypeName || 'Documento obrigatório'}${reasonDetail}`;
  } else if (isMissingMandatory) {
    status = 'BLOQUEADO';
    if (docs.length === 0) {
      blockReason = `Nenhum documento obrigatório enviado (faltam ${totalRequired} documento(s))`;
    } else {
      blockReason = `Documentação incompleta: faltam ${missingCount} documento(s) obrigatório(s)`;
    }
  } else if (pendingCount > 0) {
    status = 'BLOQUEADO';
    const firstPending = pendingDocs[0];
    blockReason = `Documento pendente de envio: ${firstPending.documentTypeName || 'Documento obrigatório'}`;
  } else if (underReviewCount > 0) {
    status = 'BLOQUEADO';
    const firstUnderReview = underReviewDocs[0];
    blockReason = `Documento aguardando análise: ${firstUnderReview.documentTypeName || 'Documento obrigatório'}`;
  } else if (totalRequired > 0 && approvedCount < totalRequired) {
    // Caso de segurança adicional se houver documentos com outros status
    status = 'BLOQUEADO';
    blockReason = `Documentação incompleta: ${approvedCount} de ${totalRequired} aprovados`;
  }

  return {
    status,
    blockReason,
    approvedDocumentsCount: approvedCount,
    pendingDocumentsCount: pendingCount,
    expiredDocumentsCount: expiredCount,
    underReviewDocumentsCount: underReviewCount,
  };
}
