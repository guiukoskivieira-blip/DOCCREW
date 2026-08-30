import { SupabaseClient } from '@supabase/supabase-js';

export interface CreateContractorPayload {
  name?: string;
  legalName?: string;
  tradeName: string;
  cnpj?: string;
  taxIdMasked?: string;
  responsibleName?: string;
  contactName?: string;
  responsibleEmail?: string;
  contactEmail?: string;
  responsiblePhone?: string;
  contactPhone?: string;
  status?: 'CONFORME' | 'PARCIAL' | 'BLOQUEADA' | 'active' | 'inactive' | 'blocked';
}

export interface CreateWorkerPayload {
  name?: string;
  fullName?: string;
  cpf?: string;
  cpfLast4?: string;
  role?: string;
  workerRoleId?: string;
  roleId?: string;
  contractorId: string;
  siteId?: string;
  employeeCode?: string;
  blockingReason?: string;
  admissionDate?: string;
  email?: string;
  phone?: string;
}

export interface CreateSitePayload {
  code: string;
  name: string;
  clientName: string;
  location?: string;
  startDate?: string;
  startsOn?: string;
  endDate?: string | null;
  endsOn?: string | null;
  status?: 'planejado' | 'ativo' | 'concluido' | 'suspenso' | 'planned' | 'active' | 'completed' | 'suspended';
}

export interface CreateDocumentTypePayload {
  name: string;
  category: 'SEGURANCA' | 'SAUDE' | 'CLT' | 'QUALIFICACAO' | 'CORPORATIVO' | 'safety' | 'occupational_health' | 'personal' | 'training' | 'certification' | 'other';
  description?: string;
  hasExpiration: boolean;
  validityMonths?: number | null;
  earlyAlertDays?: number;
  isActive?: boolean;
  isMandatory?: boolean;
  requirementScope: 'ORGANIZATION' | 'ROLE' | 'CONTRACTOR' | 'SITE';
  workerRoleId?: string;
  roleId?: string;
  contractorId?: string;
  siteId?: string;
}

export interface UploadWorkerDocumentPayload {
  workerId: string;
  contractorId?: string;
  siteId?: string;
  documentTypeId: string;
  requirementId?: string | null;
  issueDate?: string;
  issuedOn?: string;
  expiryDate?: string | null;
  expiresOn?: string | null;
  notes?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const MIME_EXTENSION_MAP: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
};

/**
 * Validates document file extension and MIME type strictly.
 * Ensures renamed executables or mismatched extensions are rejected.
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

  const fileName = file.name.toLowerCase();
  const fileExt = `.${fileName.split('.').pop() || ''}`;
  const fileMime = (file.type || '').toLowerCase().trim();

  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
  if (!allowedExtensions.includes(fileExt)) {
    return {
      valid: false,
      error: 'Extensão não suportada. Utilize apenas arquivos .pdf, .jpg, .jpeg ou .png.',
    };
  }

  // Strict MIME type verification against extension
  if (fileMime) {
    const validExtsForMime = MIME_EXTENSION_MAP[fileMime];
    if (!validExtsForMime || !validExtsForMime.includes(fileExt)) {
      return {
        valid: false,
        error: `O tipo MIME (${file.type}) é incompatível com a extensão (${fileExt}). Não são aceitos arquivos corrompidos ou renomeados.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Masks a CNPJ for privacy (never store raw CNPJ in tax_id_masked).
 */
function generateTaxIdMasked(payload: CreateContractorPayload): string {
  if (payload.taxIdMasked) return payload.taxIdMasked;
  if (!payload.cnpj) return '**.***.***/0001-**';

  const clean = payload.cnpj.replace(/\D/g, '');
  if (clean.length === 14) {
    return `**.***.${clean.slice(5, 8)}/${clean.slice(8, 12)}-**`;
  }
  return '**.***.***/0001-**';
}

/**
 * Maps contractor status to allowed DB values ('active' | 'inactive' | 'blocked').
 */
function mapContractorDbStatus(status?: string): 'active' | 'inactive' | 'blocked' {
  if (!status) return 'active';
  const s = status.toLowerCase();
  if (s === 'bloqueada' || s === 'blocked') return 'blocked';
  if (s === 'inactive' || s === 'inativo' || s === 'parcial') return 'inactive';
  return 'active';
}

/**
 * 1. TERCEIRIZADAS (contractors)
 * Exclusively uses: organization_id, legal_name, trade_name, tax_id_masked, contact_name, contact_email, contact_phone, status.
 */
export async function createContractor(
  supabase: SupabaseClient,
  organizationId: string,
  payload: CreateContractorPayload
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!organizationId) {
    return { success: false, error: 'Identificador da organização não informado' };
  }

  const legalName = (payload.legalName || payload.name || payload.tradeName || '').trim();
  const tradeName = (payload.tradeName || payload.legalName || payload.name || '').trim();

  if (!legalName || !tradeName) {
    return { success: false, error: 'Razão social e nome fantasia são obrigatórios' };
  }

  try {
    const insertData = {
      organization_id: organizationId,
      legal_name: legalName,
      trade_name: tradeName,
      tax_id_masked: generateTaxIdMasked(payload),
      contact_name: (payload.contactName || payload.responsibleName || '').trim() || null,
      contact_email: (payload.contactEmail || payload.responsibleEmail || '').trim() || null,
      contact_phone: (payload.contactPhone || payload.responsiblePhone || '').trim() || null,
      status: mapContractorDbStatus(payload.status),
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
 * 2. TRABALHADORES (workers) & 3. ALOCAÇÃO (worker_assignments)
 * Exclusively uses:
 * - workers: organization_id, contractor_id, worker_role_id, full_name, employee_code, cpf_last4, email, phone, status = 'blocked', blocking_reason
 * - worker_assignments: organization_id, worker_id, site_id, starts_on, ends_on, active = true
 */
export async function createWorker(
  supabase: SupabaseClient,
  organizationId: string,
  payload: CreateWorkerPayload
): Promise<{ success: boolean; data?: any; workerCreated?: boolean; error?: string }> {
  if (!organizationId) {
    return { success: false, error: 'Identificador da organização não informado' };
  }

  const fullName = (payload.fullName || payload.name || '').trim();
  if (!fullName) {
    return { success: false, error: 'Nome completo do trabalhador é obrigatório' };
  }

  if (!payload.contractorId) {
    return { success: false, error: 'Empresa terceirizada é obrigatória' };
  }

  const workerRoleId = payload.workerRoleId || payload.roleId;
  if (!workerRoleId) {
    return {
      success: false,
      error: 'Selecione uma função válida cadastrada no sistema. O cargo é obrigatório.',
    };
  }

  // Extract cpf_last4
  const rawCpf = payload.cpf ? payload.cpf.replace(/\D/g, '') : '';
  const cpf_last4 = rawCpf.length >= 4 ? rawCpf.slice(-4) : (payload.cpfLast4 || '0000');

  const employeeCode = payload.employeeCode || `OP-${Date.now().toString().slice(-6)}`;
  const blockingReason = payload.blockingReason || 'Pendente de envio de documentação obrigatória';

  try {
    // 1. Insert Worker with exact schema columns
    const workerData = {
      organization_id: organizationId,
      contractor_id: payload.contractorId,
      worker_role_id: workerRoleId,
      full_name: fullName,
      employee_code: employeeCode,
      cpf_last4,
      email: payload.email?.trim() || null,
      phone: payload.phone?.trim() || null,
      status: 'blocked',
      blocking_reason: blockingReason,
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

    // 2. If siteId provided, create worker_assignment with exact schema columns
    if (payload.siteId && newWorker?.id) {
      const startsOn = payload.admissionDate || new Date().toISOString().split('T')[0];
      const assignmentData = {
        organization_id: organizationId,
        worker_id: newWorker.id,
        site_id: payload.siteId,
        starts_on: startsOn,
        ends_on: null,
        active: true,
      };

      const { error: assignErr } = await supabase
        .from('worker_assignments')
        .insert(assignmentData);

      if (assignErr) {
        console.warn('Aviso: erro ao vincular obra inicial:', assignErr.message);
        return {
          success: false,
          workerCreated: true,
          data: newWorker,
          error: `Trabalhador cadastrado com sucesso, mas o vínculo com a obra falhou: ${assignErr.message}`,
        };
      }
    }

    return { success: true, data: newWorker };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao cadastrar trabalhador';
    return { success: false, error: msg };
  }
}

/**
 * Maps site status to allowed DB values ('planned' | 'active' | 'completed' | 'suspended').
 */
function mapSiteDbStatus(status?: string): 'planned' | 'active' | 'completed' | 'suspended' {
  if (!status) return 'active';
  const s = status.toLowerCase();
  if (s === 'planejado' || s === 'planned') return 'planned';
  if (s === 'concluido' || s === 'concluído' || s === 'completed') return 'completed';
  if (s === 'suspenso' || s === 'suspended') return 'suspended';
  return 'active';
}

/**
 * 4. OBRAS E CONTRATOS (sites)
 * Exclusively uses: organization_id, code, name, client_name, location, starts_on, ends_on, status.
 * Never stores "Contínuo" in date columns; uses null for continuous end date.
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
    const startsOn = payload.startsOn || payload.startDate || new Date().toISOString().split('T')[0];

    let endsOn: string | null = null;
    const rawEnd = (payload.endsOn || payload.endDate || '').trim();
    if (rawEnd && rawEnd.toLowerCase() !== 'contínuo' && rawEnd.toLowerCase() !== 'continuo') {
      endsOn = rawEnd;
    }

    const insertData = {
      organization_id: organizationId,
      code: payload.code.trim().toUpperCase(),
      name: payload.name.trim(),
      client_name: payload.clientName.trim(),
      location: payload.location?.trim() || null,
      starts_on: startsOn,
      ends_on: endsOn,
      status: mapSiteDbStatus(payload.status),
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
 * Maps category to allowed DB category values.
 */
function mapCategoryToDb(category: string): 'personal' | 'occupational_health' | 'training' | 'certification' | 'safety' | 'other' {
  const c = category.toLowerCase().trim();
  if (c === 'saude' || c === 'saúde' || c === 'occupational_health') return 'occupational_health';
  if (c === 'clt' || c === 'personal' || c === 'trabalhista') return 'personal';
  if (c === 'qualificacao' || c === 'qualificação' || c === 'training') return 'training';
  if (c === 'certification') return 'certification';
  if (c === 'corporativo' || c === 'other') return 'other';
  return 'safety';
}

/**
 * 5. TIPOS DOCUMENTAIS (document_types) & 6. EXIGÊNCIAS (document_requirements)
 * Exclusively uses:
 * - document_types: organization_id, name, category, description, has_expiration, warning_days, active
 * - document_requirements: organization_id, document_type_id, worker_role_id, contractor_id, site_id, required, warning_days, active
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
    const dbCategory = mapCategoryToDb(payload.category);
    const warningDays = payload.earlyAlertDays || (payload.hasExpiration ? 30 : null);

    // 1. Insert in document_types
    const docTypeData = {
      organization_id: organizationId,
      name: payload.name.trim(),
      category: dbCategory,
      description: payload.description?.trim() || null,
      has_expiration: payload.hasExpiration,
      warning_days: warningDays,
      active: payload.isActive ?? true,
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

    // 2. Insert document_requirements
    if (newDocType?.id) {
      const roleId = payload.requirementScope === 'ROLE' ? (payload.workerRoleId || payload.roleId || null) : null;
      const contractorId = payload.requirementScope === 'CONTRACTOR' ? (payload.contractorId || null) : null;
      const siteId = payload.requirementScope === 'SITE' ? (payload.siteId || null) : null;

      const reqData = {
        organization_id: organizationId,
        document_type_id: newDocType.id,
        worker_role_id: roleId,
        contractor_id: contractorId,
        site_id: siteId,
        required: payload.isMandatory ?? true,
        warning_days: warningDays || 30,
        active: true,
      };

      const { error: reqErr } = await supabase
        .from('document_requirements')
        .insert(reqData);

      if (reqErr) {
        console.warn('Falha ao inserir exigência de documento:', reqErr.message);
        // Rollback / deactivate created document_type so it is not active without rule
        await supabase
          .from('document_types')
          .update({ active: false })
          .eq('id', newDocType.id);

        return {
          success: false,
          error: `Erro ao criar exigência documental: ${reqErr.message}`,
        };
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
    if (payload.category !== undefined) updateData.category = mapCategoryToDb(payload.category);
    if (payload.description !== undefined) updateData.description = payload.description.trim() || null;
    if (payload.hasExpiration !== undefined) {
      updateData.has_expiration = payload.hasExpiration;
      if (!payload.hasExpiration) {
        updateData.warning_days = null;
      }
    }
    if (payload.earlyAlertDays !== undefined) {
      updateData.warning_days = payload.earlyAlertDays;
    }
    if (payload.isActive !== undefined) {
      updateData.active = payload.isActive;
    }

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
 * Generates a valid UUID v4 string.
 */
function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 7. DOCUMENTOS DOS TRABALHADORES (worker_documents)
 * Exclusively uses:
 * - id: UUID
 * - organization_id
 * - worker_id
 * - document_type_id
 * - requirement_id
 * - file_path
 * - original_file_name
 * - mime_type
 * - file_size_bytes (number)
 * - issued_on
 * - expires_on
 * - status = 'under_review'
 * - uploaded_by
 */
export async function uploadWorkerDocument(
  supabase: SupabaseClient,
  organizationId: string,
  file: File,
  payload: UploadWorkerDocumentPayload,
  uploadedByUserId?: string | null
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!organizationId) {
    return { success: false, error: 'Identificador da organização não informado' };
  }

  // 1. Validate file format and MIME consistency
  const validation = validateUploadFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const docId = generateUuid();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${organizationId}/${payload.workerId}/${docId}/${sanitizedFileName}`;

  try {
    // 2. Upload to Supabase Storage in private bucket 'worker-documents'
    const { error: uploadError } = await supabase.storage
      .from('worker-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.warn('Erro ao enviar arquivo para o Storage:', uploadError.message);
      return {
        success: false,
        error: 'Armazenamento de documentos ainda não configurado',
      };
    }

    // 3. Find requirement_id if not explicitly provided
    let requirementId = payload.requirementId || null;
    if (!requirementId && payload.documentTypeId) {
      const { data: reqs } = await supabase
        .from('document_requirements')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('document_type_id', payload.documentTypeId)
        .limit(1);

      if (reqs && reqs.length > 0) {
        requirementId = reqs[0].id;
      }
    }

    const issuedOn = payload.issuedOn || payload.issueDate || new Date().toISOString().split('T')[0];
    const expiresOn = payload.expiresOn !== undefined ? payload.expiresOn : (payload.expiryDate || null);

    // 4. Insert record into worker_documents with exact schema columns
    const docRecord = {
      id: docId,
      organization_id: organizationId,
      worker_id: payload.workerId,
      document_type_id: payload.documentTypeId,
      requirement_id: requirementId,
      file_path: filePath,
      original_file_name: file.name,
      mime_type: file.type || 'application/pdf',
      file_size_bytes: file.size,
      issued_on: issuedOn,
      expires_on: expiresOn,
      status: 'under_review',
      uploaded_by: uploadedByUserId || null,
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
 * Generates a temporary signed URL for private document download.
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
 * Updates organization subscriber profile.
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

/**
 * Updates contractor status.
 */
export async function updateContractorStatus(
  supabase: SupabaseClient,
  contractorId: string,
  status: 'active' | 'inactive' | 'blocked'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('contractors')
      .update({ status })
      .eq('id', contractorId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao atualizar status';
    return { success: false, error: msg };
  }
}

/**
 * Updates worker status.
 */
export async function updateWorkerStatus(
  supabase: SupabaseClient,
  workerId: string,
  status: 'active' | 'inactive' | 'blocked',
  blockingReason?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('workers')
      .update({
        status,
        ...(blockingReason !== undefined ? { blocking_reason: blockingReason } : {}),
      })
      .eq('id', workerId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao atualizar status';
    return { success: false, error: msg };
  }
}

/**
 * Updates worker document status and reviews.
 */
export async function updateDocumentStatus(
  supabase: SupabaseClient,
  documentId: string,
  status: 'under_review' | 'approved' | 'rejected' | 'expired',
  notes?: string,
  rejectionReason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('worker_documents')
      .update({
        status,
        rejection_reason: rejectionReason || null,
        reviewed_at: new Date().toISOString(),
        ...(notes ? { notes } : {}),
      })
      .eq('id', documentId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao atualizar status do documento';
    return { success: false, error: msg };
  }
}

// Aliases for compatibility
export const insertContractor = createContractor;
export const insertWorker = createWorker;
export const insertSite = createSite;
export const insertDocumentType = createDocumentType;

