import { CERTIFICATE_NUMBER_PREFIX } from '../../application/config/certificate.config.js';

export class CertificateNumberGenerator {
  generate(input: { organizationId: string; year: number; sequence: number }): string {
    const organizationCode = input.organizationId.replaceAll('-', '').slice(0, 6).toUpperCase();
    const sequence = String(input.sequence).padStart(6, '0');

    return `${CERTIFICATE_NUMBER_PREFIX}-${String(input.year)}-${organizationCode}-${sequence}`;
  }
}
