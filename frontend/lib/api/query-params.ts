export type QueryValue = string | number | boolean | null | undefined;

export function toQueryString<TParams extends object>(params: TParams = {} as TParams) {
  const searchParams = new URLSearchParams();

  Object.entries(params as Record<string, QueryValue>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}
