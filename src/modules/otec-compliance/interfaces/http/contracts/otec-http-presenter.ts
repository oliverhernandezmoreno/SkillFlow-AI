const excluded = new Set(['organizationId', 'deletedAt', 'internalMetadata']);

export function presentOtecResource(input: Record<string, unknown>): Record<string, unknown> {
  return present(input, (key) => key);
}

export function presentOtecReadiness(input: Record<string, unknown>): Record<string, unknown> {
  return present(input, (key) => (key === 'ruleCode' ? 'code' : key));
}

function present(
  input: Record<string, unknown>,
  publicKey: (key: string) => string,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).flatMap(([key, value]) => {
      if (excluded.has(key)) return [];
      return [[publicKey(key), serialize(value, publicKey)]];
    }),
  );
}

function serialize(value: unknown, publicKey: (key: string) => string): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((item: unknown) => serialize(item, publicKey));
  if (value && typeof value === 'object') {
    return present(value as Record<string, unknown>, publicKey);
  }
  return value;
}
