import { SupabaseClient } from '@supabase/supabase-js';

export interface CreateContractorPayload {
  name: string;
  tradeName: string;
  cnpj: string;
  responsibleName: string;
  responsibleEmail: string;
  responsiblePhone: string;
  status?: 'CONFORME' | 'PARCIAL' | 'BLOQUEADA';
}

export interface CreateWorkerPayload {
  name: string;
  cpf: string;
  role: string;
  contractorId: string;
  siteId?: string;
  admissionDate?: string;
  email?: string;
  phone?: string;
}

export interface CreateSitePayload {
  code: string;
  name: string;
  clientName: string;
  location: string;
  startDate: string;
  endDate: string;
  status?: 'planejado' | 'ativo' | 'concluido' | 'suspenso';
}

export interface CreateDocumentTypePayload {
  name: string;
  category: 'SEGURANCA' | 'SAUDE' | 'CLT' | 'QUALIFICACAO' | 'CORPORATIVO';
  description?: string;
  hasExpiration: boolean;
  validityMonths?: number | null;
  earlyAlertDays?: number;
  isActive?: boolean;
  isMandatory: boolean;
  requirementScope: 'ORGANIZATION' | 'ROLE' | 'CONTRACTOR' | 'SITE';
  roleId?: string;
  contractorId?: string;
  siteId?: string;
}

export interface UploadWorkerDocumentPayload {
  workerId: string;
  contractorId: string;
  siteId?: string;
  documentTypeId: string;
  issueDate: string;
  expiryDate?: string | null;
  notes?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
];
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

/**
 * Validates document file type and size.
 */
export function validateUploadFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'Nenhum arquivo selecionado' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `O arquivo excede o limite de 10 MB (tamanho: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
  const isAllowedExt = ALLOWED_EXTENSIONS.includes(extension);
  const isAllowedMime = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) || isAllowedExt;

  if (!isAllowedExt && !isAllowedMime) {
    return {
      valid: false,
      error: 'Formato não suportado. Utilize apenas arquivos PDF, JPG, JPEG ou PNG.',
    };
  }

  return { valid: true };
}

/**
 * Creates a new contractor in the Supabase database.
 */
export async function createContractor(
  supabase: SupabaseClient,
  organizationId: string,
  payload: CreateContractorPayload
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!organizationId) {
    return { success: false, error: 'Identificador da organização não informado' };
  }

  if (!payload.name || !payload.tradeName) {
    return { success: false, error: 'Razão social e nome fantasia são obrigatórios' };
  }

  try {
    const rawStatus = payload.status === 'CONFORME' ? 'compliant' : payload.status === 'BLOQUEADA' ? 'blocked' : 'partial';

    const insertData = {
      organization_id: organizationId,
      name: payload.name.trim(),
      trade_name: payload.tradeName.trim(),
      corporate_name: payload.name.trim(),
      cnpj: payload.cnpj.trim(),
      contact_name: payload.responsibleName?.trim() || null,
      responsible_name: payload.responsibleName?.trim() || null,
      contact_email: payload.responsibleEmail?.trim() || null,
      responsible_email: payload.responsibleEmail?.trim() || null,
      contact_phone: payload.responsiblePhone?.trim() || null,
      responsible_phone: payload.responsiblePhone?.trim() || null,
      status: rawStatus,
    };

    const { data, error } = await supabase
      .from('contractors')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.warn('Erro ao inserir contractor:', error.message);
      return { success: false, error: `Erro no Supabase: ${error.message}` };
    }

    return { success: true, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao cadastrar terceirizada';
    return { success: false, error: msg };
  }
}

/**
 * Creates a new worker and initial work assignment in Supabase.
 * Starts with status BLOQUEADO (blocked) as mandatory compliance rule.
 */
export async function createWorker(
  supabase: SupabaseClient,
  organizationId: string,
  payload: CreateWorkerPayload
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!organizationId) {
    return { success: false, error: 'Identificador da organização não informado' };
  }

  if (!payload.name || !payload.contractorId || !payload.role) {
    return { success: false, error: 'Nome, terceirizada e função são obrigatórios' };
  }

  try {
    // 1. Insert Worker with initial status 'blocked'
    const workerData = {
      organization_id: organizationId,
      contractor_id: payload.contractorId,
      name: payload.name.trim(),
      cpf: payload.cpf?.trim() || null,
      role: payload.role.trim(),
      status: 'blocked',
      admission_date: payload.admissionDate || new Date().toISOString().split('T')[0],
    };

    const { data: newWorker, error: workerErr } = await supabase
      .from('workers')
      .insert(workerData)
      .select()
      .single();

    if (workerErr) {
      console.warn('Erro ao inserir trabalhador:', workerErr.message);
      return { success: false, error: `Erro ao cadastrar trabalhador: ${workerErr.message}` };
    }

    // 2. If siteId provided, create worker_assignment
    if (payload.siteId && newWorker?.id) {
      const assignmentData = {
        organization_id: organizationId,
        worker_id: newWorker.id,
        site_id: payload.siteId,
        status: 'active',
      };

      const { error: assignErr } = await supabase
        .from('worker_assignments')
        .insert(assignmentData);

      if (assignErr) {
        console.warn('Aviso: erro ao vincular obra inicial:', assignErr.message);
      }
    }

    return { success: true, data: newWorker };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao cadastrar trabalhador';
    return { success: false, error: msg };
  }
}

/**
 * Creates a new site/contract in Supabase.
 */
export async function createSite(
  supabase: SupabaseClient,
  organizationId: string,
  payload: CreateSitePayload
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!organizationId) {
    return { success: false, error: 'Identificador da organização não informado' };
  }

  if (!payload.code || !payload.name || !payload.clientName) {
    return { success: false, error: 'Código, nome da obra e cliente são obrigatórios' };
  }

  try {
    const insertData = {
      organization_id: organizationId,
      code: payload.code.trim().toUpperCase(),
      name: payload.name.trim(),
      client_name: payload.clientName.trim(),
      location: payload.location?.trim() || 'Não informada',
      start_date: payload.startDate || new Date().toISOString().split('T')[0],
      end_date: payload.endDate || 'Contínuo',
      status: payload.status || 'active',
    };

    const { data, error } = await supabase
      .from('sites')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.warn('Erro ao cadastrar obra:', error.message);
      return { success: false, error: `Erro no Supabase: ${error.message}` };
    }

    return { success: true, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao cadastrar obra';
    return { success: false, error: msg };
  }
}

/**
 * Creates a new custom Document Type and its associated requirements.
 */
export async function createDocumentType(
  supabase: SupabaseClient,
  organizationId: string,
  payload: CreateDocumentTypePayload
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!organizationId) {
    return { success: false, error: 'Identificador da organização não informado' };
  }

  if (!payload.name) {
    return { success: false, error: 'Nome do tipo de documento é obrigatório' };
  }

  try {
    // 1. Insert in document_types
    const docTypeData = {
      organization_id: organizationId,
      name: payload.name.trim(),
      category: payload.category,
      description: payload.description?.trim() || null,
      validity_months: payload.hasExpiration ? (payload.validityMonths || 12) : null,
      is_mandatory: payload.isMandatory,
    };

    const { data: newDocType, error: docTypeErr } = await supabase
      .from('document_types')
      .insert(docTypeData)
      .select()
      .single();

    if (docTypeErr) {
      console.warn('Erro ao criar tipo de documento:', docTypeErr.message);
      return { success: false, error: `Erro no Supabase: ${docTypeErr.message}` };
    }

    // 2. Insert requirement if specific scope is defined
    if (newDocType?.id) {
      const reqData: any = {
        organization_id: organizationId,
        document_type_id: newDocType.id,
        is_mandatory: payload.isMandatory,
      };

      if (payload.requirementScope === 'ROLE' && payload.roleId) {
        reqData.role_id = payload.roleId;
      }
      if (payload.requirementScope === 'SITE' && payload.siteId) {
        reqData.site_id = payload.siteId;
      }

      const { error: reqErr } = await supabase
        .from('document_requirements')
        .insert(reqData);

      if (reqErr) {
        console.warn('Aviso: falha ao inserir exigência de documento:', reqErr.message);
      }
    }

    return { success: true, data: newDocType };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao criar tipo de documento';
    return { success: false, error: msg };
  }
}

/**
 * Updates an existing Document Type.
 */
export async function updateDocumentType(
  supabase: SupabaseClient,
  organizationId: string,
  docTypeId: string,
  payload: Partial<CreateDocumentTypePayload>
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!organizationId || !docTypeId) {
    return { success: false, error: 'Identificadores inválidos' };
  }

  try {
    const updateData: any = {};
    if (payload.name !== undefined) updateData.name = payload.name.trim();
    if (payload.category !== undefined) updateData.category = payload.category;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.hasExpiration !== undefined) {
      updateData.validity_months = payload.hasExpiration ? (payload.validityMonths || 12) : null;
    } else if (payload.validityMonths !== undefined) {
      updateData.validity_months = payload.validityMonths;
    }
    if (payload.isMandatory !== undefined) updateData.is_mandatory = payload.isMandatory;

    const { data, error } = await supabase
      .from('document_types')
      .update(updateData)
      .eq('id', docTypeId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao atualizar tipo de documento';
    return { success: false, error: msg };
  }
}

/**
 * Uploads a worker document to Supabase Storage and records it in worker_documents.
 * Follows strict security rules:
 * - Private bucket: worker-documents
 * - Storage path: organization_id/worker_id/doc_id/file_name
 * - Status initial: under_review (AGUARDANDO_ANALISE)
 * - Safe rollback if DB insert fails
 */
export async function uploadWorkerDocument(
  supabase: SupabaseClient,
  organizationId: string,
  file: File,
  payload: UploadWorkerDocumentPayload
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!organizationId) {
    return { success: false, error: 'Identificador da organização não informado' };
  }

  // 1. Validate file
  const validation = validateUploadFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const docId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${organizationId}/${payload.workerId}/${docId}/${sanitizedFileName}`;

  try {
    // 2. Attempt upload to Supabase Storage in private bucket 'worker-documents'
    const { error: uploadError } = await supabase.storage
      .from('worker-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.warn('Erro ao enviar arquivo para o Storage:', uploadError.message);
      // Explicit feedback required when storage bucket or policies are missing
      return {
        success: false,
        error: 'Armazenamento de documentos ainda não configurado',
      };
    }

    // 3. Insert record into worker_documents
    const fileSizeFormatted = `${(file.size / 1024).toFixed(0)} KB`;
    const docRecord = {
      id: docId,
      organization_id: organizationId,
      worker_id: payload.workerId,
      document_type_id: payload.documentTypeId,
      contractor_id: payload.contractorId,
      site_id: payload.siteId || null,
      status: 'under_review',
      issue_date: payload.issueDate,
      expiry_date: payload.expiryDate || null,
      file_path: filePath,
      file_name: file.name,
      file_size: fileSizeFormatted,
      correction_notes: payload.notes || null,
    };

    const { data: insertedDoc, error: dbError } = await supabase
      .from('worker_documents')
      .insert(docRecord)
      .select()
      .single();

    if (dbError) {
      console.warn('Erro ao gravar worker_document no banco:', dbError.message);
      // Clean up orphaned uploaded file from storage
      try {
        await supabase.storage.from('worker-documents').remove([filePath]);
      } catch (cleanupErr) {
        console.warn('Erro ao remover arquivo órfão:', cleanupErr);
      }
      return {
        success: false,
        error: `Erro ao registrar documento no banco: ${dbError.message}`,
      };
    }

    return { success: true, data: insertedDoc };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha no processamento do documento';
    return { success: false, error: msg };
  }
}

/**
 * Generates a secure, temporary signed URL for private document download.
 */
export async function getDocumentDownloadUrl(
  supabase: SupabaseClient,
  filePath: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!filePath) {
    return { success: false, error: 'Arquivo demonstrativo não disponível' };
  }

  try {
    const { data, error } = await supabase.storage
      .from('worker-documents')
      .createSignedUrl(filePath, 3600); // 1 hour validity

    if (error || !data?.signedUrl) {
      return {
        success: false,
        error: error?.message || 'Arquivo demonstrativo não disponível no armazenamento',
      };
    }

    return { success: true, url: data.signedUrl };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao obter URL assinada';
    return { success: false, error: msg };
  }
}

/**
 * Updates organization subscriber profile (only available DB columns).
 */
export async function updateOrganizationProfile(
  supabase: SupabaseClient,
  organizationId: string,
  payload: { name: string; slug?: string }
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!organizationId) {
    return { success: false, error: 'Identificador da organização não informado' };
  }

  try {
    const { data, error } = await supabase
      .from('organizations')
      .update({
        name: payload.name.trim(),
        ...(payload.slug ? { slug: payload.slug.trim() } : {}),
      })
      .eq('id', organizationId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao atualizar dados da organização';
    return { success: false, error: msg };
  }
}
