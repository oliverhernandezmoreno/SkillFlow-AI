import { formatReference, formatStatus } from '@/lib/formatters/status';

describe('commercial formatters', () => {
  it('translates backend statuses for business users', () => {
    expect(formatStatus('ACTIVE')).toBe('Activo');
    expect(formatStatus('WAITLISTED')).toBe('Lista de espera');
    expect(formatStatus('ISSUED')).toBe('Emitido');
    expect(formatStatus('OBSERVED')).toBe('Observado');
  });

  it('shortens technical identifiers when a human label is unavailable', () => {
    expect(formatReference('550e8400-e29b-41d4-a716-446655440000')).toBe('Ref. 550E84');
    expect(formatReference('Seguridad Operacional')).toBe('Seguridad Operacional');
  });
});
