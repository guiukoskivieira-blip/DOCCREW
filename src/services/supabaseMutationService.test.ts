import { describe, it, expect, vi } from 'vitest';
import {
  insertContractor,
  insertWorker,
  insertSite,
  insertDocumentType,
  uploadWorkerDocument,
  updateContractorStatus,
  updateWorkerStatus,
  updateDocumentStatus,
  validateUploadFile,
} from './supabaseMutationService';
import { SupabaseClient } from '@supabase/supabase-js';

describe('Supabase Mutation Service - Strict Real Schema Compliance', () => {
  const orgId = 'org-test-uuid-123';

  describe('Contractor Mutations (contractors table)', () => {
    it('sends strictly validated columns with masked tax_id and mapped status', async () => {
      let insertedPayload: any = null;

      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          expect(table).toBe('contractors');
          return {
            insert: vi.fn().mockImplementation((payload: any) => {
              insertedPayload = payload;
              return {
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: 'contractor-uuid-999',
                      ...payload,
                      created_at: new Date().toISOString(),
                    },
                    error: null,
                  }),
                }),
              };
            }),
          };
        }),
      } as unknown as SupabaseClient;

      const result = await insertContractor(mockSupabase, orgId, {
        name: 'Alpha Construções e Montagens Ltda',
        tradeName: 'Alpha Montagens',
        cnpj: '12.345.678/0001-90',
        responsibleName: 'Carlos Eduardo',
        responsibleEmail: 'carlos@alpha.com',
        responsiblePhone: '(11) 98765-4321',
        status: 'CONFORME',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      // Check allowed columns ONLY
      expect(insertedPayload).toEqual({
        organization_id: orgId,
        legal_name: 'Alpha Construções e Montagens Ltda',
        trade_name: 'Alpha Montagens',
        tax_id_masked: '**.***.678/0001-**',
        contact_name: 'Carlos Eduardo',
        contact_email: 'carlos@alpha.com',
        contact_phone: '(11) 98765-4321',
        status: 'active',
      });

      // Strict check: forbidden columns must NOT be present
      expect(insertedPayload).not.toHaveProperty('cnpj');
      expect(insertedPayload).not.toHaveProperty('corporate_name');
      expect(insertedPayload).not.toHaveProperty('name');
      expect(insertedPayload).not.toHaveProperty('responsible_name');
      expect(insertedPayload).not.toHaveProperty('responsible_email');
      expect(insertedPayload).not.toHaveProperty('responsible_phone');
    });

    it('maps status correctly to active, inactive, blocked', async () => {
      let capturedStatus: string = '';

      const createMock = (targetStatus: string) => {
        return {
          from: vi.fn().mockReturnValue({
            insert: vi.fn().mockImplementation((payload: any) => {
              capturedStatus = payload.status;
              return {
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'c-1', ...payload },
                    error: null,
                  }),
                }),
              };
            }),
          }),
        } as unknown as SupabaseClient;
      };

      await insertContractor(createMock('PARCIAL'), orgId, {
        name: 'Beta Servicos',
        tradeName: 'Beta',
        cnpj: '12345678000199',
        status: 'PARCIAL',
      });
      expect(capturedStatus).toBe('inactive');

      await insertContractor(createMock('BLOQUEADA'), orgId, {
        name: 'Gamma Servicos',
        tradeName: 'Gamma',
        cnpj: '12345678000199',
        status: 'BLOQUEADA',
      });
      expect(capturedStatus).toBe('blocked');
    });
  });

  describe('Worker Mutations (workers & worker_assignments tables)', () => {
    it('inserts worker with cpf_last4, worker_role_id and strictly allowed columns', async () => {
      let workerPayload: any = null;
      let assignmentPayload: any = null;

      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'workers') {
            return {
              insert: vi.fn().mockImplementation((payload: any) => {
                workerPayload = payload;
                return {
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: 'worker-uuid-123',
                        ...payload,
                        created_at: new Date().toISOString(),
                      },
                      error: null,
                    }),
                  }),
                };
              }),
            };
          }
          if (table === 'worker_assignments') {
            return {
              insert: vi.fn().mockImplementation((payload: any) => {
                assignmentPayload = payload;
                return Promise.resolve({ data: [payload], error: null });
              }),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient;

      const result = await insertWorker(mockSupabase, orgId, {
        fullName: 'José da Silva Sauro',
        cpf: '123.456.789-01',
        workerRoleId: 'role-electrician-uuid',
        contractorId: 'contractor-uuid-999',
        siteId: 'site-uuid-555',
        admissionDate: '2025-01-10',
        email: 'jose@silva.com',
        phone: '(11) 91234-5678',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      // Check worker payload
      expect(workerPayload).toEqual({
        organization_id: orgId,
        contractor_id: 'contractor-uuid-999',
        worker_role_id: 'role-electrician-uuid',
        full_name: 'José da Silva Sauro',
        employee_code: expect.any(String),
        cpf_last4: '8901', // last 4 digits of 12345678901 -> '8901'
        email: 'jose@silva.com',
        phone: '(11) 91234-5678',
        status: 'blocked',
        blocking_reason: 'Pendente de envio de documentação obrigatória',
      });

      // Strict check: full CPF must NEVER be recorded
      expect(workerPayload).not.toHaveProperty('cpf');
      expect(workerPayload).not.toHaveProperty('name');
      expect(workerPayload).not.toHaveProperty('role');

      // Check assignment payload
      expect(assignmentPayload).toEqual({
        organization_id: orgId,
        worker_id: 'worker-uuid-123',
        site_id: 'site-uuid-555',
        starts_on: '2025-01-10',
        ends_on: null,
        active: true,
      });
      expect(assignmentPayload).not.toHaveProperty('startDate');
      expect(assignmentPayload).not.toHaveProperty('endDate');
    });

    it('reports partial success when worker creation succeeds but site allocation fails', async () => {
      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'workers') {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: 'worker-created-123',
                      organization_id: orgId,
                      contractor_id: 'contractor-1',
                      worker_role_id: 'role-1',
                      full_name: 'Marcos Paulo',
                      cpf_last4: '4321',
                      status: 'active',
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'worker_assignments') {
            return {
              insert: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Foreign key violation on site_id' },
              }),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient;

      const result = await insertWorker(mockSupabase, orgId, {
        fullName: 'Marcos Paulo',
        cpf: '00000004321',
        workerRoleId: 'role-1',
        contractorId: 'contractor-1',
        siteId: 'invalid-site-id',
      });

      expect(result.success).toBe(false);
      expect(result.workerCreated).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toContain('o vínculo com a obra falhou');
    });
  });

  describe('Site Mutations (sites table)', () => {
    it('uses starts_on, ends_on and stores null for continuous projects', async () => {
      let sitePayload: any = null;

      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          expect(table).toBe('sites');
          return {
            insert: vi.fn().mockImplementation((payload: any) => {
              sitePayload = payload;
              return {
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'site-123', ...payload },
                    error: null,
                  }),
                }),
              };
            }),
          };
        }),
      } as unknown as SupabaseClient;

      const result = await insertSite(mockSupabase, orgId, {
        code: 'OBR-009',
        name: 'Planta Solar Sertão',
        clientName: 'SolarTech Brasil',
        location: 'Juazeiro - BA',
        startDate: '2025-03-01',
        endDate: 'Contínuo', // Non-date text must be converted to null
        status: 'ativo',
      });

      expect(result.success).toBe(true);
      expect(sitePayload).toEqual({
        organization_id: orgId,
        code: 'OBR-009',
        name: 'Planta Solar Sertão',
        client_name: 'SolarTech Brasil',
        location: 'Juazeiro - BA',
        starts_on: '2025-03-01',
        ends_on: null,
        status: 'active',
      });

      // Strict check
      expect(sitePayload).not.toHaveProperty('startDate');
      expect(sitePayload).not.toHaveProperty('endDate');
      expect(sitePayload).not.toHaveProperty('clientName');
    });
  });

  describe('Document Type & Requirement Rollback', () => {
    it('deactivates document_type if requirement creation fails to prevent orphan active rules', async () => {
      let deactivationCalled = false;

      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'document_types') {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: 'doc-type-new-id',
                      organization_id: orgId,
                      name: 'ASO Especial',
                      active: true,
                    },
                    error: null,
                  }),
                }),
              }),
              update: vi.fn().mockImplementation((updatePayload: any) => {
                expect(updatePayload.active).toBe(false);
                return {
                  eq: vi.fn().mockImplementation((col: string, val: string) => {
                    if (val === 'doc-type-new-id') {
                      deactivationCalled = true;
                    }
                    return Promise.resolve({ data: null, error: null });
                  }),
                };
              }),
            };
          }
          if (table === 'document_requirements') {
            return {
              insert: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Check constraint violation on scope' },
              }),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient;

      const result = await insertDocumentType(mockSupabase, orgId, {
        name: 'ASO Especial',
        category: 'SAUDE',
        hasExpiration: true,
        validityMonths: 12,
        isMandatory: true,
        requirementScope: 'ROLE',
        workerRoleId: 'invalid-role-id',
      });

      expect(result.success).toBe(false);
      expect(deactivationCalled).toBe(true);
      expect(result.error).toContain('Erro ao criar exigência documental');
    });
  });

  describe('File Upload Validation & Worker Document Insertion', () => {
    it('validates mime type and file extension matching strictly', () => {
      // Valid PDF
      const validPdf = new File(['%PDF-1.4'], 'documento.pdf', { type: 'application/pdf' });
      expect(validateUploadFile(validPdf).valid).toBe(true);

      // Valid Image
      const validJpg = new File(['fakeimg'], 'foto.jpg', { type: 'image/jpeg' });
      expect(validateUploadFile(validJpg).valid).toBe(true);

      // Fake PDF: exe renamed to .pdf
      const fakePdf = new File(['fakebinary'], 'malware.pdf', { type: 'application/x-msdownload' });
      expect(validateUploadFile(fakePdf).valid).toBe(false);
      expect(validateUploadFile(fakePdf).error).toContain('MIME');

      // Executable
      const exeFile = new File(['exe'], 'app.exe', { type: 'application/octet-stream' });
      expect(validateUploadFile(exeFile).valid).toBe(false);
    });

    it('uploads file to storage and creates worker_documents with exact schema columns', async () => {
      let storageUploaded = false;
      let insertedDocPayload: any = null;

      const mockSupabase = {
        storage: {
          from: vi.fn().mockReturnValue({
            upload: vi.fn().mockImplementation((path: string, file: any) => {
              storageUploaded = true;
              return Promise.resolve({ data: { path }, error: null });
            }),
            getPublicUrl: vi.fn().mockReturnValue({
              data: { publicUrl: 'https://storage.supabase.co/v1/object/public/docucrew-documents/test.pdf' },
            }),
          }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'worker_documents') {
            return {
              insert: vi.fn().mockImplementation((payload: any) => {
                insertedDocPayload = payload;
                return {
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { id: 'doc-row-123', ...payload },
                      error: null,
                    }),
                  }),
                };
              }),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient;

      const testFile = new File(['dummycontent'], 'aso-aso.pdf', { type: 'application/pdf' });

      const result = await uploadWorkerDocument(mockSupabase, orgId, testFile, {
        workerId: 'worker-123',
        documentTypeId: 'doctype-aso-1',
        requirementId: 'req-uuid-999',
        issueDate: '2025-01-15',
        expiryDate: '2026-01-15',
        notes: 'Apto para trabalho em altura',
      });

      expect(result.success).toBe(true);
      expect(storageUploaded).toBe(true);

      // Check document row payload
      expect(insertedDocPayload).toEqual({
        id: expect.any(String),
        organization_id: orgId,
        worker_id: 'worker-123',
        document_type_id: 'doctype-aso-1',
        requirement_id: 'req-uuid-999',
        file_path: expect.stringContaining(`${orgId}/worker-123/`),
        original_file_name: 'aso-aso.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: testFile.size,
        issued_on: '2025-01-15',
        expires_on: '2026-01-15',
        status: 'under_review',
        uploaded_by: null,
      });

      // Strict check: forbidden columns
      expect(insertedDocPayload).not.toHaveProperty('documentName');
      expect(insertedDocPayload).not.toHaveProperty('documentTypeName');
      expect(insertedDocPayload).not.toHaveProperty('contractor_id');
      expect(insertedDocPayload).not.toHaveProperty('site_id');
    });
  });

  describe('Status Update Mutations', () => {
    it('updates contractor status to valid active/inactive/blocked enum values', async () => {
      let updatedStatus = '';

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockImplementation((payload: any) => {
            updatedStatus = payload.status;
            return {
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }),
        }),
      } as unknown as SupabaseClient;

      await updateContractorStatus(mockSupabase, 'c-1', 'active');
      expect(updatedStatus).toBe('active');

      await updateContractorStatus(mockSupabase, 'c-1', 'blocked');
      expect(updatedStatus).toBe('blocked');
    });

    it('updates worker status to valid active/inactive/blocked enum values', async () => {
      let updatedStatus = '';

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockImplementation((payload: any) => {
            updatedStatus = payload.status;
            return {
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }),
        }),
      } as unknown as SupabaseClient;

      await updateWorkerStatus(mockSupabase, 'w-1', 'blocked');
      expect(updatedStatus).toBe('blocked');
    });

    it('updates worker document status to pending/approved/rejected/expired with review details', async () => {
      let updatePayload: any = null;

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockImplementation((payload: any) => {
            updatePayload = payload;
            return {
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }),
        }),
      } as unknown as SupabaseClient;

      await updateDocumentStatus(mockSupabase, 'doc-1', 'approved', 'Auditado e validado por Eng. Silva');

      expect(updatePayload).toEqual({
        status: 'approved',
        rejection_reason: null,
        reviewed_at: expect.any(String),
        notes: 'Auditado e validado por Eng. Silva',
      });
    });
  });
});
