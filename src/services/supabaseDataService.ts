import { SupabaseClient } from '@supabase/supabase-js';
import {
  adaptSupabaseData,
  AdaptedSupabaseData,
  RawContractor,
  RawSite,
  RawWorkerRole,
  RawWorker,
  RawWorkerAssignment,
  RawDocumentType,
  RawDocumentRequirement,
  RawWorkerDocument,
} from '../domain/supabaseAdapters';

export interface UserOrganizationResult {
  organizationId: string | null;
  organizationName: string;
  userRole?: string;
  found: boolean;
  error?: string;
}

export interface DashboardFetchResult {
  success: boolean;
  data?: AdaptedSupabaseData;
  error?: string;
  organizationName: string;
  isEmpty: boolean;
}

/**
 * Queries Supabase to find the user's organization via organization_members.
 * Uses organizations(id, name, slug) and strictly does not reference trade_name.
 */
export async function fetchUserOrganization(
  supabase: SupabaseClient,
  userId: string
): Promise<UserOrganizationResult> {
  const defaultOrgName = 'DocuCrew Demonstração';

  try {
    // 1. Query organization_members for the authenticated user
    const { data: members, error: memberErr } = await supabase
      .from('organization_members')
      .select('organization_id, role, organizations(id, name, slug)')
      .eq('user_id', userId)
      .limit(1);

    if (memberErr) {
      console.warn('Erro ao consultar organization_members:', memberErr.message);
      return {
        organizationId: null,
        organizationName: defaultOrgName,
        found: false,
        error: memberErr.message,
      };
    }

    if (members && members.length > 0) {
      const member = members[0];
      const orgRel = member.organizations as unknown as { id?: string; name?: string; slug?: string } | null;

      let orgName = orgRel?.name;
      const orgId = member.organization_id || orgRel?.id || null;

      if (!orgName && orgId) {
        // Query organizations table directly by id (without trade_name)
        const { data: orgData, error: orgErr } = await supabase
          .from('organizations')
          .select('id, name, slug')
          .eq('id', orgId)
          .maybeSingle();

        if (orgErr) {
          console.warn('Erro ao consultar organization por ID:', orgErr.message);
        } else if (orgData) {
          orgName = orgData.name;
        }
      }

      if (orgId) {
        return {
          organizationId: orgId,
          organizationName: orgName || defaultOrgName,
          userRole: member.role,
          found: true,
        };
      }
    }

    // No membership record found for this user in organization_members
    return {
      organizationId: null,
      organizationName: defaultOrgName,
      found: false,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Falha ao buscar organização';
    console.warn('Exceção ao buscar organização:', errorMsg);
    return {
      organizationId: null,
      organizationName: defaultOrgName,
      found: false,
      error: errorMsg,
    };
  }
}

/**
 * Loads all related operational tables from Supabase and transforms them into DocuCrew domain entities.
 * Explicitly applies .eq('organization_id', organizationId) across all 8 tables.
 */
export async function loadSupabaseDashboardData(
  supabase: SupabaseClient,
  organizationId: string
): Promise<DashboardFetchResult> {
  const orgName = 'DocuCrew Demonstração';

  if (!organizationId) {
    return {
      success: false,
      error: 'ID da organização não fornecido',
      organizationName: orgName,
      isEmpty: true,
    };
  }

  try {
    // Helper to query each table explicitly filtering by organization_id
    const queryTable = async <T>(tableName: string): Promise<T[]> => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('organization_id', organizationId);

      if (error) {
        console.warn(`Erro na consulta da tabela ${tableName}:`, error.message);
        throw new Error(`Erro ao consultar ${tableName}: ${error.message}`);
      }
      return (data || []) as T[];
    };

    // Parallel fetch of all 8 core tables with explicit organization_id filter
    const [
      rawContractors,
      rawSites,
      rawRoles,
      rawWorkers,
      rawAssignments,
      rawDocumentTypes,
      rawRequirements,
      rawWorkerDocuments,
    ] = await Promise.all([
      queryTable<RawContractor>('contractors'),
      queryTable<RawSite>('sites'),
      queryTable<RawWorkerRole>('worker_roles'),
      queryTable<RawWorker>('workers'),
      queryTable<RawWorkerAssignment>('worker_assignments'),
      queryTable<RawDocumentType>('document_types'),
      queryTable<RawDocumentRequirement>('document_requirements'),
      queryTable<RawWorkerDocument>('worker_documents'),
    ]);

    const isEmpty =
      rawContractors.length === 0 &&
      rawSites.length === 0 &&
      rawWorkers.length === 0 &&
      rawWorkerDocuments.length === 0;

    // Adapt raw DB entities to application entities
    const adaptedData = adaptSupabaseData({
      rawContractors,
      rawSites,
      rawRoles,
      rawWorkers,
      rawAssignments,
      rawDocumentTypes,
      rawRequirements,
      rawWorkerDocuments,
    });

    return {
      success: true,
      data: adaptedData,
      organizationName: orgName,
      isEmpty,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro de conexão com o banco Supabase';
    console.warn('Erro ao carregar dados do Supabase:', errorMsg);
    return {
      success: false,
      error: errorMsg,
      organizationName: orgName,
      isEmpty: true,
    };
  }
}
