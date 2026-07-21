export type OtecHttpMethod = 'get' | 'post' | 'patch';

export const OTEC_HTTP_ROUTE_MANIFEST: readonly {
  method: OtecHttpMethod;
  path: string;
}[] = [
  { method: 'get', path: '/otec-compliance/profile' },
  { method: 'post', path: '/otec-compliance/profile' },
  { method: 'patch', path: '/otec-compliance/profile' },
  { method: 'post', path: '/otec-compliance/profile/deactivation' },
  ...resourceRoutes('/otec-compliance/accreditations', ['suspension', 'revocation']),
  ...resourceRoutes('/otec-compliance/quality-certifications', ['deactivation']),
  ...resourceRoutes('/otec-compliance/offices', ['deactivation']),
  ...resourceRoutes('/otec-compliance/legal-representatives', ['deactivation']),
  ...resourceRoutes('/otec-compliance/resolutions', ['supersession', 'deactivation']),
  { method: 'post', path: '/otec-compliance/readiness/evaluations' },
  { method: 'get', path: '/otec-compliance/compliance-summary' },
  { method: 'get', path: '/otec-compliance/expiring-items' },
];

function resourceRoutes(base: string, transitions: readonly string[]) {
  return [
    { method: 'get' as const, path: base },
    { method: 'post' as const, path: base },
    { method: 'get' as const, path: `${base}/{id}` },
    { method: 'patch' as const, path: `${base}/{id}` },
    ...transitions.map((transition) => ({
      method: 'post' as const,
      path: `${base}/{id}/${transition}`,
    })),
  ];
}
