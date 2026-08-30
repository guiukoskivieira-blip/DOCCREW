import { describe, it, expect } from 'vitest';
import {
  mapDocumentStatus,
  mapWorkerStatus,
  mapContractorStatus,
  calculateIndicators,
  adaptSupabaseData,
  maskCpf,
  maskCnpj,
  getAvatarInitials,
} from './supabaseAdapters';
import { Worker, WorkerDocument } from '../types';

describe('Supabase Status & Data Adapters', () => {
  describe('Document Status Mapping', () => {
    it('correctly maps approved/aprovado to APROVADO', () => {
      expect(mapDocumentStatus('approved')).toBe('APROVADO');
      expect(mapDocumentStatus('aprovado')).toBe('APROVADO');
      expect(mapDocumentStatus('APROVADO')).toBe('APROVADO');
    });

    it('correctly maps expiring/proximo_vencimento to PROXIMO_VENCIMENTO', () => {
      expect(mapDocumentStatus('expiring')).toBe('PROXIMO_VENCIMENTO');
      expect(mapDocumentStatus('proximo_vencimento')).toBe('PROXIMO_VENCIMENTO');
      expect(mapDocumentStatus('a_vencer')).toBe('PROXIMO_VENCIMENTO');
    });

    it('correctly maps expired/vencido to VENCIDO', () => {
      expect(mapDocumentStatus('expired')).toBe('VENCIDO');
      expect(mapDocumentStatus('vencido')).toBe('VENCIDO');
      expect(mapDocumentStatus('VENCIDO')).toBe('VENCIDO');
    });

    it('correctly maps rejected/recusado to RECUSADO', () => {
      expect(mapDocumentStatus('rejected')).toBe('RECUSADO');
      expect(mapDocumentStatus('recusado')).toBe('RECUSADO');
      expect(mapDocumentStatus('reprovado')).toBe('RECUSADO');
    });

    it('correctly maps pending/pendente to PENDENTE', () => {
      expect(mapDocumentStatus('pending')).toBe('PENDENTE');
      expect(mapDocumentStatus('pendente')).toBe('PENDENTE');
      expect(mapDocumentStatus(null)).toBe('PENDENTE');
      expect(mapDocumentStatus(undefined)).toBe('PENDENTE');
    });

    it('correctly maps under_review/aguardando_analise to AGUARDANDO_ANALISE', () => {
      expect(mapDocumentStatus('under_review')).toBe('AGUARDANDO_ANALISE');
      expect(mapDocumentStatus('aguardando_analise')).toBe('AGUARDANDO_ANALISE');
      expect(mapDocumentStatus('em_analise')).toBe('AGUARDANDO_ANALISE');
    });
  });

  describe('Worker & Contractor Status Mapping', () => {
    it('maps released to LIBERADO and blocked to BLOQUEADO', () => {
      expect(mapWorkerStatus('released')).toBe('LIBERADO');
      expect(mapWorkerStatus('liberado')).toBe('LIBERADO');
      expect(mapWorkerStatus('blocked')).toBe('BLOQUEADO');
      expect(mapWorkerStatus('bloqueado')).toBe('BLOQUEADO');
      expect(mapWorkerStatus(null)).toBe('BLOQUEADO');
    });

    it('maps contractor statuses correctly', () => {
      expect(mapContractorStatus('conforme')).toBe('CONFORME');
      expect(mapContractorStatus('active')).toBe('CONFORME');
      expect(mapContractorStatus('parcial')).toBe('PARCIAL');
      expect(mapContractorStatus('bloqueada')).toBe('BLOQUEADA');
    });
  });

  describe('Indicator Calculations', () => {
    it('calculates dashboard metrics accurately from workers and documents', () => {
      const mockWorkers: Worker[] = [
        {
          id: 'w-1',
          name: 'João Silva',
          cpfMasked: '***.123.456-**',
          role: 'Pedreiro',
          contractorId: 'c-1',
          contractorName: 'Alpha',
          siteIds: ['s-1'],
          status: 'LIBERADO',
          pendingDocumentsCount: 0,
          expiredDocumentsCount: 0,
          underReviewDocumentsCount: 0,
          approvedDocumentsCount: 2,
          totalRequiredDocuments: 2,
          avatarInitials: 'JS',
          admissionDate: '2025-01-01',
        },
        {
          id: 'w-2',
          name: 'Carlos Mendes',
          cpfMasked: '***.654.321-**',
          role: 'Eletricista',
          contractorId: 'c-1',
          contractorName: 'Alpha',
          siteIds: ['s-1'],
          status: 'BLOQUEADO',
          pendingDocumentsCount: 1,
          expiredDocumentsCount: 1,
          underReviewDocumentsCount: 0,
          approvedDocumentsCount: 0,
          totalRequiredDocuments: 2,
          avatarInitials: 'CM',
          admissionDate: '2025-01-01',
        },
      ];

      const mockDocs: WorkerDocument[] = [
        {
          id: 'd-1',
          workerId: 'w-1',
          workerName: 'João Silva',
          contractorId: 'c-1',
          contractorName: 'Alpha',
          siteId: 's-1',
          siteName: 'Obra 1',
          documentTypeId: 'dt-1',
          documentTypeName: 'ASO',
          category: 'SAUDE',
          issueDate: '2025-01-01',
          expiryDate: '2026-01-01',
          status: 'APROVADO',
        },
        {
          id: 'd-2',
          workerId: 'w-1',
          workerName: 'João Silva',
          contractorId: 'c-1',
          contractorName: 'Alpha',
          siteId: 's-1',
          siteName: 'Obra 1',
          documentTypeId: 'dt-2',
          documentTypeName: 'NR-35',
          category: 'SEGURANCA',
          issueDate: '2025-01-01',
          expiryDate: '2025-10-01',
          status: 'PROXIMO_VENCIMENTO',
        },
        {
          id: 'd-3',
          workerId: 'w-2',
          workerName: 'Carlos Mendes',
          contractorId: 'c-1',
          contractorName: 'Alpha',
          siteId: 's-1',
          siteName: 'Obra 1',
          documentTypeId: 'dt-1',
          documentTypeName: 'ASO',
          category: 'SAUDE',
          issueDate: '2024-01-01',
          expiryDate: '2024-12-31',
          status: 'VENCIDO',
        },
        {
          id: 'd-4',
          workerId: 'w-2',
          workerName: 'Carlos Mendes',
          contractorId: 'c-1',
          contractorName: 'Alpha',
          siteId: 's-1',
          siteName: 'Obra 1',
          documentTypeId: 'dt-2',
          documentTypeName: 'NR-10',
          category: 'SEGURANCA',
          issueDate: '2025-01-01',
          expiryDate: '2026-01-01',
          status: 'AGUARDANDO_ANALISE',
        },
      ];

      const indicators = calculateIndicators(mockWorkers, mockDocs);

      expect(indicators.totalWorkers).toBe(2);
      expect(indicators.releasedWorkers).toBe(1);
      expect(indicators.blockedWorkers).toBe(1);
      expect(indicators.complianceRate).toBe(50);
      expect(indicators.expiredDocuments).toBe(1);
      expect(indicators.expiringDocuments).toBe(1);
      expect(indicators.underReviewDocuments).toBe(1);
      expect(indicators.approvedDocuments).toBe(1);
    });
  });

  describe('Full Supabase Data Adaptation', () => {
    it('adapts raw database tables and runs evaluateWorkerCompliance', () => {
      const adapted = adaptSupabaseData({
        rawContractors: [
          {
            id: 'c-1',
            trade_name: 'Engenharia Alfa',
            corporate_name: 'Alfa Engenharia LTDA',
            cnpj: '12345678000199',
            contact_name: 'Roberto',
          },
        ],
        rawSites: [
          {
            id: 's-1',
            name: 'Obra Edifício Horizon',
            code: 'OB-HORIZON',
            client_name: 'Horizon Empreendimentos',
          },
        ],
        rawRoles: [
          {
            id: 'r-1',
            name: 'Eletricista',
          },
        ],
        rawWorkers: [
          {
            id: 'w-1',
            contractor_id: 'c-1',
            name: 'Mariana Souza',
            cpf: '12345678901',
            role_id: 'r-1',
          },
        ],
        rawAssignments: [
          {
            worker_id: 'w-1',
            site_id: 's-1',
          },
        ],
        rawDocumentTypes: [
          {
            id: 'dt-1',
            name: 'ASO Clínico',
            category: 'SAUDE',
            is_mandatory: true,
          },
        ],
        rawRequirements: [
          {
            document_type_id: 'dt-1',
            role_id: 'r-1',
            is_mandatory: true,
          },
        ],
        rawWorkerDocuments: [
          {
            id: 'wd-1',
            worker_id: 'w-1',
            document_type_id: 'dt-1',
            status: 'approved',
            issue_date: '2025-01-01',
            expiry_date: '2026-01-01',
          },
        ],
      });

      expect(adapted.contractors).toHaveLength(1);
      expect(adapted.contractors[0].tradeName).toBe('Engenharia Alfa');
      expect(adapted.worksites).toHaveLength(1);
      expect(adapted.worksites[0].name).toBe('Obra Edifício Horizon');
      expect(adapted.workers).toHaveLength(1);
      expect(adapted.workers[0].name).toBe('Mariana Souza');
      expect(adapted.workers[0].status).toBe('LIBERADO'); // evaluated by compliance
      expect(adapted.documents).toHaveLength(1);
      expect(adapted.documents[0].status).toBe('APROVADO');
      expect(adapted.documents[0].workerName).toBe('Mariana Souza');
    });
  });

  describe('Utilities: masking and initials', () => {
    it('masks CPF and CNPJ safely', () => {
      expect(maskCpf('12345678901')).toBe('***.456.789-**');
      expect(maskCpf(null)).toBe('***.***.***-**');
      expect(maskCnpj('12345678000199')).toBe('**.***.678/0001-**');
      expect(maskCnpj(null)).toBe('**.***.***/0001-**');
    });

    it('generates initials properly', () => {
      expect(getAvatarInitials('Lucas Costa')).toBe('LC');
      expect(getAvatarInitials('Gabriel')).toBe('GA');
      expect(getAvatarInitials(null)).toBe('TR');
    });
  });
});
