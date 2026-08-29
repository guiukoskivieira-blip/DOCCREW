import { describe, it, expect } from 'vitest';
import { evaluateWorkerCompliance, DocumentLike } from './workerCompliance';

describe('evaluateWorkerCompliance - Regras de Conformidade e Liberação de Trabalhadores', () => {
  // Teste 1: Libera quando todos os obrigatórios estão aprovados
  it('deve liberar o trabalhador quando todos os documentos obrigatórios estiverem APROVADOS', () => {
    const docs: DocumentLike[] = [
      { documentTypeName: 'ASO Admissional', status: 'APROVADO' },
      { documentTypeName: 'NR-35 Trabalho em Altura', status: 'APROVADO' },
      { documentTypeName: 'NR-10 Segurança em Eletricidade', status: 'APROVADO' },
      { documentTypeName: 'Ficha de EPI', status: 'APROVADO' },
    ];

    const result = evaluateWorkerCompliance(docs, 4);

    expect(result.status).toBe('LIBERADO');
    expect(result.blockReason).toBeUndefined();
    expect(result.approvedDocumentsCount).toBe(4);
    expect(result.pendingDocumentsCount).toBe(0);
    expect(result.expiredDocumentsCount).toBe(0);
    expect(result.underReviewDocumentsCount).toBe(0);
  });

  // Teste 2: Considera PROXIMO_VENCIMENTO como válido
  it('deve considerar documento com status PROXIMO_VENCIMENTO como válido e manter o trabalhador LIBERADO', () => {
    const docs: DocumentLike[] = [
      { documentTypeName: 'ASO Periódico', status: 'PROXIMO_VENCIMENTO' },
      { documentTypeName: 'NR-35 Trabalho em Altura', status: 'APROVADO' },
      { documentTypeName: 'Ficha de EPI', status: 'APROVADO' },
    ];

    const result = evaluateWorkerCompliance(docs, 3);

    expect(result.status).toBe('LIBERADO');
    expect(result.blockReason).toBeUndefined();
    expect(result.approvedDocumentsCount).toBe(3);
    expect(result.expiredDocumentsCount).toBe(0);
    expect(result.pendingDocumentsCount).toBe(0);
    expect(result.underReviewDocumentsCount).toBe(0);
  });

  // Teste 3: Bloqueia documento aguardando análise
  it('deve bloquear o trabalhador quando houver documento com status AGUARDANDO_ANALISE', () => {
    const docs: DocumentLike[] = [
      { documentTypeName: 'ASO Periódico', status: 'APROVADO' },
      { documentTypeName: 'NR-35 Trabalho em Altura', status: 'AGUARDANDO_ANALISE' },
      { documentTypeName: 'Ficha de EPI', status: 'APROVADO' },
    ];

    const result = evaluateWorkerCompliance(docs, 3);

    expect(result.status).toBe('BLOQUEADO');
    expect(result.blockReason).toContain('Documento aguardando análise');
    expect(result.blockReason).toContain('NR-35 Trabalho em Altura');
    expect(result.underReviewDocumentsCount).toBe(1);
    expect(result.approvedDocumentsCount).toBe(2);
  });

  // Teste 4: Bloqueia quando falta documento obrigatório
  it('deve bloquear quando a quantidade de documentos enviados for menor que o total obrigatório', () => {
    const docs: DocumentLike[] = [
      { documentTypeName: 'ASO Admissional', status: 'APROVADO' },
      { documentTypeName: 'NR-35 Trabalho em Altura', status: 'APROVADO' },
    ];

    // Exige 4 documentos obrigatórios mas foram fornecidos apenas 2
    const result = evaluateWorkerCompliance(docs, 4);

    expect(result.status).toBe('BLOQUEADO');
    expect(result.blockReason).toContain('Documentação incompleta');
    expect(result.blockReason).toContain('faltam 2 documento(s) obrigatório(s)');
    expect(result.approvedDocumentsCount).toBe(2);
  });

  // Teste 5: Bloqueia documento pendente
  it('deve bloquear o trabalhador quando houver documento PENDENTE de envio', () => {
    const docs: DocumentLike[] = [
      { documentTypeName: 'ASO Admissional', status: 'APROVADO' },
      { documentTypeName: 'NR-10 Segurança em Eletricidade', status: 'PENDENTE' },
      { documentTypeName: 'Ficha de EPI', status: 'APROVADO' },
    ];

    const result = evaluateWorkerCompliance(docs, 3);

    expect(result.status).toBe('BLOQUEADO');
    expect(result.blockReason).toContain('Documento pendente de envio');
    expect(result.blockReason).toContain('NR-10 Segurança em Eletricidade');
    expect(result.pendingDocumentsCount).toBe(1);
  });

  // Teste 6: Bloqueia documento vencido
  it('deve bloquear o trabalhador quando houver documento VENCIDO', () => {
    const docs: DocumentLike[] = [
      { documentTypeName: 'ASO Admissional', status: 'APROVADO' },
      { documentTypeName: 'Certificado NR-33', status: 'VENCIDO' },
      { documentTypeName: 'Ficha de EPI', status: 'APROVADO' },
    ];

    const result = evaluateWorkerCompliance(docs, 3);

    expect(result.status).toBe('BLOQUEADO');
    expect(result.blockReason).toContain('Documento vencido');
    expect(result.blockReason).toContain('Certificado NR-33');
    expect(result.expiredDocumentsCount).toBe(1);
  });

  // Teste 7: Bloqueia documento recusado e apresenta o motivo
  it('deve bloquear o trabalhador quando houver documento RECUSADO e apresentar o motivo da recusa', () => {
    const docs: DocumentLike[] = [
      { documentTypeName: 'ASO Admissional', status: 'APROVADO' },
      {
        documentTypeName: 'Certificado NR-35',
        status: 'RECUSADO',
        rejectionReason: 'Certificado ilegível e sem carimbo do instrutor',
      },
      { documentTypeName: 'Ficha de EPI', status: 'APROVADO' },
    ];

    const result = evaluateWorkerCompliance(docs, 3);

    expect(result.status).toBe('BLOQUEADO');
    expect(result.blockReason).toContain('Documento recusado');
    expect(result.blockReason).toContain('Certificado NR-35');
    expect(result.blockReason).toContain('Certificado ilegível e sem carimbo do instrutor');
  });

  // Teste Adicional 8: Trabalhador sem nenhum documento obrigatório enviado
  it('deve bloquear o trabalhador quando nenhum documento obrigatório tiver sido enviado', () => {
    const docs: DocumentLike[] = [];

    const result = evaluateWorkerCompliance(docs, 4);

    expect(result.status).toBe('BLOQUEADO');
    expect(result.blockReason).toContain('Nenhum documento obrigatório enviado');
    expect(result.blockReason).toContain('faltam 4');
    expect(result.approvedDocumentsCount).toBe(0);
    expect(result.pendingDocumentsCount).toBe(0);
    expect(result.expiredDocumentsCount).toBe(0);
    expect(result.underReviewDocumentsCount).toBe(0);
  });

  // Teste Adicional 9: Prioridade estrita dos motivos de bloqueio
  it('deve respeitar a ordem estrita de prioridade de motivos (Vencido > Recusado > Ausente > Pendente > Aguardando Análise)', () => {
    // Vencido tem prioridade máxima mesmo se houver recusado, pendente e em análise
    const docsWithExpiredAndRejected: DocumentLike[] = [
      { documentTypeName: 'ASO Periódico', status: 'VENCIDO' },
      { documentTypeName: 'NR-35', status: 'RECUSADO', rejectionReason: 'Assinatura inválida' },
      { documentTypeName: 'NR-10', status: 'AGUARDANDO_ANALISE' },
    ];
    const resultExpired = evaluateWorkerCompliance(docsWithExpiredAndRejected, 3);
    expect(resultExpired.status).toBe('BLOQUEADO');
    expect(resultExpired.blockReason).toContain('Documento vencido');

    // Recusado tem prioridade sobre pendente e aguardando análise
    const docsWithRejectedAndPending: DocumentLike[] = [
      { documentTypeName: 'NR-35', status: 'RECUSADO', rejectionReason: 'Documento cortado' },
      { documentTypeName: 'NR-10', status: 'PENDENTE' },
      { documentTypeName: 'Ficha de EPI', status: 'AGUARDANDO_ANALISE' },
    ];
    const resultRejected = evaluateWorkerCompliance(docsWithRejectedAndPending, 3);
    expect(resultRejected.status).toBe('BLOQUEADO');
    expect(resultRejected.blockReason).toContain('Documento recusado');

    // Pendente tem prioridade sobre aguardando análise
    const docsWithPendingAndReview: DocumentLike[] = [
      { documentTypeName: 'ASO', status: 'APROVADO' },
      { documentTypeName: 'NR-10', status: 'PENDENTE' },
      { documentTypeName: 'Ficha de EPI', status: 'AGUARDANDO_ANALISE' },
    ];
    const resultPending = evaluateWorkerCompliance(docsWithPendingAndReview, 3);
    expect(resultPending.status).toBe('BLOQUEADO');
    expect(resultPending.blockReason).toContain('Documento pendente de envio');
  });
});
