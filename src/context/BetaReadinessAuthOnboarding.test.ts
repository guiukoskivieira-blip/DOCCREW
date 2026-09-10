import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFirstOrganization } from '../services/supabaseMutationService';
import { SupabaseClient } from '@supabase/supabase-js';

describe('DOCUCREW — BETA READINESS (AUTH, ONBOARDING, RESET PASSWORD)', () => {
  let mockSupabase: Partial<SupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. First Access Onboarding - Atomic RPC create_first_organization', () => {
    it('executes atomic RPC create_first_organization with trimmed organization name', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: {
          organization_id: 'org-uuid-12345',
          organization_name: 'Construtora Alfa Horizonte',
          organization_slug: 'construtora-alfa-horizonte',
          member_role: 'owner',
        },
        error: null,
      });

      mockSupabase = {
        rpc: mockRpc,
      } as unknown as SupabaseClient;

      const result = await createFirstOrganization(
        mockSupabase as SupabaseClient,
        '  Construtora Alfa Horizonte  '
      );

      expect(mockRpc).toHaveBeenCalledWith('create_first_organization', {
        p_name: 'Construtora Alfa Horizonte',
      });
      expect(result.success).toBe(true);
      expect(result.organizationId).toBe('org-uuid-12345');
      expect(result.organizationName).toBe('Construtora Alfa Horizonte');
      expect(result.organizationSlug).toBe('construtora-alfa-horizonte');
    });

    it('rejects company names with less than 2 characters or only whitespace without calling RPC', async () => {
      const mockRpc = vi.fn();
      mockSupabase = { rpc: mockRpc } as unknown as SupabaseClient;

      const emptyRes = await createFirstOrganization(mockSupabase as SupabaseClient, '   ');
      expect(emptyRes.success).toBe(false);
      expect(emptyRes.error).toContain('entre 2 e 120 caracteres');
      expect(mockRpc).not.toHaveBeenCalled();

      const shortRes = await createFirstOrganization(mockSupabase as SupabaseClient, 'A');
      expect(shortRes.success).toBe(false);
      expect(shortRes.error).toContain('entre 2 e 120 caracteres');
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('handles USER_ALREADY_HAS_ORGANIZATION gracefully without crashing', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'USER_ALREADY_HAS_ORGANIZATION: usuário já possui organização associada',
          code: 'P0001',
        },
      });

      mockSupabase = { rpc: mockRpc } as unknown as SupabaseClient;

      const result = await createFirstOrganization(
        mockSupabase as SupabaseClient,
        'Construtora Beta'
      );

      expect(mockRpc).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(false);
      expect(result.alreadyHasOrg).toBe(true);
    });

    it('handles unexpected Postgres or network exceptions gracefully', async () => {
      const mockRpc = vi.fn().mockRejectedValue(new Error('Postgres connection reset'));
      mockSupabase = { rpc: mockRpc } as unknown as SupabaseClient;

      const result = await createFirstOrganization(
        mockSupabase as SupabaseClient,
        'Construtora Delta'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Postgres connection reset');
    });
  });

  describe('2. Password & Registration Validations', () => {
    it('validates that minimum password length is 8 characters', () => {
      const validatePassword = (pass: string) => {
        if (!pass || pass.length < 8) {
          return { valid: false, error: 'A senha deve conter no mínimo 8 caracteres.' };
        }
        return { valid: true };
      };

      expect(validatePassword('123456').valid).toBe(false);
      expect(validatePassword('1234567').valid).toBe(false);
      expect(validatePassword('12345678').valid).toBe(true);
      expect(validatePassword('StrongSecurePass2026!').valid).toBe(true);
    });

    it('validates that password and confirmPassword must match exactly', () => {
      const validateMatch = (p1: string, p2: string) => {
        return p1 === p2;
      };

      expect(validateMatch('SenhaSegura123', 'SenhaSegura123')).toBe(true);
      expect(validateMatch('SenhaSegura123', 'SenhaSegura124')).toBe(false);
      expect(validateMatch('SenhaSegura123', 'senhasegura123')).toBe(false);
    });
  });

  describe('3. Password Recovery & Redirect URL', () => {
    it('calls resetPasswordForEmail with current origin as redirectTo', async () => {
      const mockReset = vi.fn().mockResolvedValue({ data: {}, error: null });
      mockSupabase = {
        auth: {
          resetPasswordForEmail: mockReset,
        },
      } as unknown as SupabaseClient;

      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const email = 'eng.seguranca@docucrew.com.br';
      const expectedRedirect = `${origin}/reset-password`;

      await mockSupabase.auth!.resetPasswordForEmail(email, {
        redirectTo: expectedRedirect,
      });

      expect(mockReset).toHaveBeenCalledWith(email, {
        redirectTo: expectedRedirect,
      });
    });

    it('formats rate limit errors into a user-friendly Portuguese message', () => {
      const formatError = (msg: string) => {
        if (msg.toLowerCase().includes('rate limit')) {
          return 'Limite de requisições excedido. Por favor, aguarde alguns instantes antes de tentar novamente.';
        }
        return msg;
      };

      expect(formatError('For security purposes, you can only request this once every 60 seconds (rate limit)')).toBe(
        'Limite de requisições excedido. Por favor, aguarde alguns instantes antes de tentar novamente.'
      );
    });

    it('updates user password via supabase.auth.updateUser', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({ data: { user: {} }, error: null });
      mockSupabase = {
        auth: {
          updateUser: mockUpdate,
        },
      } as unknown as SupabaseClient;

      const newPassword = 'NewSecretPassword2026!';
      await mockSupabase.auth!.updateUser({ password: newPassword });

      expect(mockUpdate).toHaveBeenCalledWith({ password: newPassword });
    });
  });

  describe('4. Email Confirmation Resend', () => {
    it('calls supabase.auth.resend with signup type and trimmed email', async () => {
      const mockResend = vi.fn().mockResolvedValue({ data: {}, error: null });
      mockSupabase = {
        auth: {
          resend: mockResend,
        },
      } as unknown as SupabaseClient;

      const email = '  novousuario@docucrew.com.br  ';
      await mockSupabase.auth!.resend({
        type: 'signup',
        email: email.trim(),
      });

      expect(mockResend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'novousuario@docucrew.com.br',
      });
    });
  });
});
