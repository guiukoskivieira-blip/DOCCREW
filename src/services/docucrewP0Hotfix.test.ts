import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { updateDocumentStatus, getDocumentDownloadUrl } from './supabaseMutationService';
import { SupabaseClient } from '@supabase/supabase-js';

describe('DOCUCREW - Hotfix P0 Regression Suite', () => {
  beforeEach(() => {
    if (typeof globalThis.window === 'undefined') {
      (globalThis as any).window = {} as any;
    }
    globalThis.window.open = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('P0-01: Document Approval Persistence', () => {
    it('calls updateDocumentStatus with "approved" and succeeds when Supabase responds OK', async () => {
      let capturedPayload: any = null;
      let targetDocId = '';

      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          expect(table).toBe('worker_documents');
          return {
            update: vi.fn().mockImplementation((payload: any) => {
              capturedPayload = payload;
              return {
                eq: vi.fn().mockImplementation((col: string, val: string) => {
                  expect(col).toBe('id');
                  targetDocId = val;
                  return Promise.resolve({ data: null, error: null });
                }),
              };
            }),
          };
        }),
      } as unknown as SupabaseClient;

      const result = await updateDocumentStatus(
        mockSupabase,
        'doc-aso-001',
        'approved',
        'Aprovado por Fiscal Roberto Farias (TST)'
      );

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(targetDocId).toBe('doc-aso-001');
      expect(capturedPayload.status).toBe('approved');
      expect(capturedPayload.rejection_reason).toBeNull();
      expect(capturedPayload.notes).toBe('Aprovado por Fiscal Roberto Farias (TST)');
      expect(typeof capturedPayload.reviewed_at).toBe('string');
    });

    it('propagates error when Supabase update fails and prevents false approval', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Network error or RLS violation on worker_documents' },
            }),
          }),
        }),
      } as unknown as SupabaseClient;

      const result = await updateDocumentStatus(mockSupabase, 'doc-nr35-002', 'approved');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error or RLS violation on worker_documents');
    });

    it('persists rejection correctly with reason and reviewed_at timestamp', async () => {
      let capturedPayload: any = null;
      let targetDocId = '';

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockImplementation((payload: any) => {
            capturedPayload = payload;
            return {
              eq: vi.fn().mockImplementation((col: string, val: string) => {
                targetDocId = val;
                return Promise.resolve({ data: null, error: null });
              }),
            };
          }),
        }),
      } as unknown as SupabaseClient;

      const reason = 'Assinatura do médico ausente no documento';
      const result = await updateDocumentStatus(
        mockSupabase,
        'doc-aso-999',
        'rejected',
        `Rejeitado por Fiscal TST: ${reason}`,
        reason
      );

      expect(result.success).toBe(true);
      expect(targetDocId).toBe('doc-aso-999');
      expect(capturedPayload.status).toBe('rejected');
      expect(capturedPayload.rejection_reason).toBe(reason);
      expect(capturedPayload.notes).toContain(reason);
    });
  });

  describe('P0-02: Signed URL Document Download', () => {
    it('passes EXCLUSIVELY the string URL to window.open when Signed URL generation succeeds', async () => {
      const signedUrlString = 'https://mock-supabase.storage/v1/object/sign/worker-documents/org-1/worker-1/doc.pdf?token=xyz123';

      const mockSupabase = {
        storage: {
          from: vi.fn().mockReturnValue({
            createSignedUrl: vi.fn().mockResolvedValue({
              data: { signedUrl: signedUrlString },
              error: null,
            }),
          }),
        },
      } as unknown as SupabaseClient;

      const downloadResult = await getDocumentDownloadUrl(mockSupabase, 'org-1/worker-1/doc.pdf');

      expect(downloadResult.success).toBe(true);
      expect(typeof downloadResult.url).toBe('string');
      expect(downloadResult.url).toBe(signedUrlString);

      // Simulate consumer handler logic from DocumentosPage
      if (downloadResult.success && downloadResult.url && typeof downloadResult.url === 'string') {
        window.open(downloadResult.url, '_blank');
      }

      // Assert window.open was called with the exact string, not [object Object]
      expect(window.open).toHaveBeenCalledTimes(1);
      expect(window.open).toHaveBeenCalledWith(signedUrlString, '_blank');

      const openedArg = vi.mocked(window.open).mock.calls[0][0];
      expect(openedArg).not.toBe('[object Object]');
      expect(typeof openedArg).toBe('string');
      expect(openedArg).toContain('https://');
    });

    it('does NOT call window.open when Signed URL generation fails', async () => {
      const mockSupabase = {
        storage: {
          from: vi.fn().mockReturnValue({
            createSignedUrl: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Object not found in storage' },
            }),
          }),
        },
      } as unknown as SupabaseClient;

      const downloadResult = await getDocumentDownloadUrl(mockSupabase, 'invalid/path/doc.pdf');

      expect(downloadResult.success).toBe(false);
      expect(downloadResult.url).toBeUndefined();
      expect(downloadResult.error).toBe('Object not found in storage');

      // Consumer check
      if (downloadResult.success && downloadResult.url && typeof downloadResult.url === 'string') {
        window.open(downloadResult.url, '_blank');
      }

      expect(window.open).not.toHaveBeenCalled();
    });

    it('does NOT call window.open when filePath is missing or empty', async () => {
      const mockSupabase = {
        storage: {
          from: vi.fn(),
        },
      } as unknown as SupabaseClient;

      const downloadResult = await getDocumentDownloadUrl(mockSupabase, '');

      expect(downloadResult.success).toBe(false);
      expect(downloadResult.url).toBeUndefined();

      if (downloadResult.success && downloadResult.url) {
        window.open(downloadResult.url, '_blank');
      }

      expect(window.open).not.toHaveBeenCalled();
    });
  });
});
