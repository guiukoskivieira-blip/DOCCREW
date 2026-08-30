import { describe, it, expect, vi } from 'vitest';
import {
  fetchUserOrganization,
  loadSupabaseDashboardData,
} from './supabaseDataService';
import { SupabaseClient } from '@supabase/supabase-js';

describe('Supabase Data Service - DocuCrew Hotfix', () => {
  describe('fetchUserOrganization', () => {
    it('queries organization_members using organizations(id, name, slug) without trade_name', async () => {
      let capturedSelect = '';
      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          expect(table).toBe('organization_members');
          return {
            select: vi.fn().mockImplementation((fields: string) => {
              capturedSelect = fields;
              return {
                eq: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [
                      {
                        organization_id: 'org-abc-123',
                        role: 'admin',
                        organizations: {
                          id: 'org-abc-123',
                          name: 'DocuCrew Demonstração',
                          slug: 'docucrew-demo',
                        },
                      },
                    ],
                    error: null,
                  }),
                }),
              };
            }),
          };
        }),
      } as unknown as SupabaseClient;

      const result = await fetchUserOrganization(mockSupabase, 'user-123');

      // Assertions
      expect(capturedSelect).toBe('organization_id, role, organizations(id, name, slug)');
      expect(capturedSelect).not.toContain('trade_name');
      expect(result.found).toBe(true);
      expect(result.organizationId).toBe('org-abc-123');
      expect(result.organizationName).toBe('DocuCrew Demonstração');
      expect(result.userRole).toBe('admin');
    });

    it('returns found: false when user has no membership row (ORG_NOT_FOUND)', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient;

      const result = await fetchUserOrganization(mockSupabase, 'user-sem-vinculo');

      expect(result.found).toBe(false);
      expect(result.organizationId).toBeNull();
      expect(result.organizationName).toBe('DocuCrew Demonstração');
      // Must not perform unfiltered queries to organizations table
      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('organization_members');
    });

    it('returns error when query to organization_members fails', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection timeout', code: 'PGRST000' },
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient;

      const result = await fetchUserOrganization(mockSupabase, 'user-error');

      expect(result.found).toBe(false);
      expect(result.error).toBe('Database connection timeout');
      expect(result.organizationId).toBeNull();
    });

    it('handles unexpected thrown exceptions gracefully', async () => {
      const mockSupabase = {
        from: vi.fn().mockImplementation(() => {
          throw new Error('Network failure');
        }),
      } as unknown as SupabaseClient;

      const result = await fetchUserOrganization(mockSupabase, 'user-throw');

      expect(result.found).toBe(false);
      expect(result.error).toBe('Network failure');
    });
  });

  describe('loadSupabaseDashboardData with explicit organization_id filtering', () => {
    it('applies .eq("organization_id", organizationId) across all 8 operational tables', async () => {
      const queriedTables: string[] = [];
      const appliedFilters: Record<string, { column: string; value: string }> = {};

      const mockSupabase = {
        from: vi.fn().mockImplementation((tableName: string) => {
          queriedTables.push(tableName);
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockImplementation((col: string, val: string) => {
                appliedFilters[tableName] = { column: col, value: val };
                return Promise.resolve({
                  data: tableName === 'contractors'
                    ? [
                        {
                          id: 'c-1',
                          organization_id: 'org-target-999',
                          trade_name: 'Alpha Engenharia',
                          corporate_name: 'Alpha LTDA',
                        },
                      ]
                    : [],
                  error: null,
                });
              }),
            }),
          };
        }),
      } as unknown as SupabaseClient;

      const result = await loadSupabaseDashboardData(mockSupabase, 'org-target-999');

      expect(result.success).toBe(true);

      // Verify all 8 core tables are queried
      const requiredTables = [
        'contractors',
        'sites',
        'worker_roles',
        'workers',
        'worker_assignments',
        'document_types',
        'document_requirements',
        'worker_documents',
      ];

      expect(queriedTables.sort()).toEqual(requiredTables.sort());

      // Verify .eq('organization_id', 'org-target-999') is applied to all 8 tables
      requiredTables.forEach((table) => {
        expect(appliedFilters[table]).toBeDefined();
        expect(appliedFilters[table].column).toBe('organization_id');
        expect(appliedFilters[table].value).toBe('org-target-999');
      });

      expect(result.data?.contractors).toHaveLength(1);
      expect(result.data?.contractors[0].tradeName).toBe('Alpha Engenharia');
    });

    it('returns error when organizationId is missing or empty', async () => {
      const mockSupabase = {} as unknown as SupabaseClient;
      const result = await loadSupabaseDashboardData(mockSupabase, '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('ID da organização não fornecido');
    });

    it('returns success: false and error message when database table query fails', async () => {
      const mockSupabase = {
        from: vi.fn().mockImplementation((tableName: string) => {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: { message: `Permission denied on table ${tableName}` },
              }),
            }),
          };
        }),
      } as unknown as SupabaseClient;

      const result = await loadSupabaseDashboardData(mockSupabase, 'org-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied on table');
    });
  });
});
